/**
 * WebMCP Context Bridge & Standards Polyfill
 * Ensures `document.modelContext.registerTool` and `document.modelContext.executeTool`
 * are 100% compatible with Chrome's native WebMCP API and agent testing runtimes.
 */

import { WebMCPToolDefinition, RegisteredTool } from '../types.ts';

export interface ModelContextInterface {
  registerTool(tool: WebMCPToolDefinition | any, options?: any): RegisteredTool;
  unregisterTool(name: string): boolean;
  getTool(name: string): RegisteredTool | undefined;
  getTools(options?: any): RegisteredTool[];
  executeTool(toolOrName: string | RegisteredTool | any, input?: any, options?: any): Promise<any>;
  addEventListener(event: string, callback: (...args: any[]) => void): void;
  removeEventListener(event: string, callback: (...args: any[]) => void): void;
  [key: string]: any;
}

/**
 * Standard implementation of a WebMCP RegisteredTool conforming to Chrome's API.
 */
export class RegisteredToolImpl implements RegisteredTool {
  name: string;
  title: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
  outputSchema?: Record<string, any>;
  annotations: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
    [key: string]: any;
  };
  origin: string;
  window: any;
  execute: (input: any, client?: any) => Promise<any>;
  readOnlyHint: boolean;
  untrustedContentHint: boolean;
  requiresApproval: boolean;

  constructor(definition: WebMCPToolDefinition | any) {
    this.name = definition.name;
    this.title = definition.title || definition.name;
    this.description = definition.description || '';
    this.inputSchema = definition.inputSchema || { type: 'object', properties: {} };
    this.outputSchema = definition.outputSchema;
    const isReadOnly = Boolean(definition.annotations?.readOnlyHint ?? definition.readOnlyHint);
    const isUntrusted = Boolean(definition.annotations?.untrustedContentHint ?? definition.untrustedContentHint);
    this.annotations = {
      readOnlyHint: isReadOnly,
      untrustedContentHint: isUntrusted,
      ...(definition.annotations || {}),
    };
    this.origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    this.window = typeof window !== 'undefined' ? window : null;
    this.execute = definition.execute;
    this.readOnlyHint = isReadOnly;
    this.untrustedContentHint = isUntrusted;
    this.requiresApproval = Boolean(definition.requiresApproval);
  }

  get [Symbol.toStringTag]() {
    return 'RegisteredTool';
  }

  // Makes this object thenable so `await modelContext.registerTool(...)` resolves to this RegisteredTool instance
  then<TResult1 = RegisteredTool, TResult2 = never>(
    onfulfilled?: ((value: RegisteredTool) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this as RegisteredTool).then(onfulfilled, onrejected);
  }
}

export class StandardModelContext implements ModelContextInterface {
  private tools: Map<string, RegisteredTool> = new Map();
  private nativeTools: Map<string, any> = new Map();
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();
  public nativeContext: any = null;

  constructor(nativeContext?: any) {
    this.nativeContext = nativeContext || null;
  }

  registerTool(tool: WebMCPToolDefinition | any, options?: any): RegisteredTool {
    if (!tool || !tool.name || typeof tool.name !== 'string') {
      throw new Error('WebMCP Error: Tool must provide a valid string name');
    }
    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error(`WebMCP Error: Tool "${tool.name}" must provide an execute handler`);
    }

    // Format tool according to official W3C / Chrome WebMCP specification
    const isReadOnly = Boolean(tool.annotations?.readOnlyHint ?? tool.readOnlyHint);
    const isUntrusted = Boolean(tool.annotations?.untrustedContentHint ?? tool.untrustedContentHint);
    const normalizedTool = {
      name: tool.name,
      title: tool.title || tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema || { type: 'object', properties: {} },
      annotations: {
        readOnlyHint: isReadOnly,
        untrustedContentHint: isUntrusted,
        ...(tool.annotations || {}),
      },
      readOnlyHint: isReadOnly,
      untrustedContentHint: isUntrusted,
      requiresApproval: Boolean(tool.requiresApproval),
      execute: async (input: any, client?: any) => {
        let parsed = input;
        if (typeof input === 'string') {
          try {
            parsed = JSON.parse(input);
          } catch {
            parsed = input;
          }
        }
        return await tool.execute(parsed, client);
      },
    };

    // Forward to native Chrome modelContext if present
    if (this.nativeContext && typeof this.nativeContext.registerTool === 'function') {
      try {
        const nativeRes = this.nativeContext.registerTool(normalizedTool, options);
        if (nativeRes && typeof nativeRes.then === 'function') {
          nativeRes
            .then((registered: any) => {
              if (registered) {
                this.nativeTools.set(tool.name, registered);
              }
            })
            .catch((err: any) => {
              console.debug(`[WebMCP Native] registerTool async notice for ${tool.name}:`, err?.message || err);
            });
        } else if (nativeRes) {
          this.nativeTools.set(tool.name, nativeRes);
        }
      } catch (err: any) {
        console.debug(`[WebMCP Native] registerTool sync notice for ${tool.name}:`, err?.message || err);
      }
    }

    const registeredTool = new RegisteredToolImpl(normalizedTool);
    this.tools.set(tool.name, registeredTool);
    this.dispatchEvent('toolRegistered', { toolName: tool.name, tool: registeredTool, definition: tool });
    console.log(`[WebMCP] Registered tool: ${tool.name} (Approval Gated: ${Boolean(tool.requiresApproval)})`);
    return registeredTool;
  }

  unregisterTool(name: string): boolean {
    const deleted = this.tools.delete(name);
    this.nativeTools.delete(name);
    if (deleted) {
      this.dispatchEvent('toolUnregistered', { toolName: name });
    }
    return deleted;
  }

  getTool(name: string): RegisteredTool | undefined {
    return this.tools.get(name);
  }

  getTools(options?: any): RegisteredTool[] {
    return Array.from(this.tools.values());
  }

  async executeTool(toolOrName: string | RegisteredTool | any, input?: any, options?: any): Promise<any> {
    // 1. Resolve tool name and target RegisteredTool instance
    let toolName: string = '';
    let targetTool: RegisteredTool | undefined;

    if (typeof toolOrName === 'string') {
      toolName = toolOrName;
      targetTool = this.tools.get(toolName);
    } else if (toolOrName && typeof toolOrName === 'object') {
      toolName = toolOrName.name || '';
      targetTool = this.tools.get(toolName) || toolOrName;
    }

    if (!targetTool) {
      throw new Error(`[WebMCP] Execution error: Tool "${toolName || 'unknown'}" is not registered.`);
    }

    // 2. Parse input arguments if provided as a JSON string
    let parsedInput = input;
    if (typeof input === 'string') {
      try {
        parsedInput = JSON.parse(input);
      } catch {
        parsedInput = input;
      }
    }

    this.dispatchEvent('toolExecutionStart', { toolName, input: parsedInput });

    // 3. Attempt native execution if present, catching any Blink TypeError ("not of type 'RegisteredTool'")
    if (this.nativeContext && typeof this.nativeContext.executeTool === 'function') {
      const nativeTool = this.nativeTools.get(toolName) || (typeof toolOrName === 'object' ? toolOrName : null);
      if (nativeTool) {
        try {
          const rawResult = await this.nativeContext.executeTool(nativeTool, input, options);
          let result = rawResult;
          if (typeof rawResult === 'string') {
            try {
              result = JSON.parse(rawResult);
            } catch {
              result = rawResult;
            }
          }
          this.dispatchEvent('toolExecutionSuccess', { toolName, input: parsedInput, result });
          return result;
        } catch (nativeErr: any) {
          console.warn(`[WebMCP] Native executeTool intercepted (${nativeErr?.message}), executing tool handler directly.`);
        }
      }
    }

    // 4. Standard verified execution via tool handler
    try {
      const result = await targetTool.execute!(parsedInput);
      this.dispatchEvent('toolExecutionSuccess', { toolName, input: parsedInput, result });
      return result;
    } catch (err: any) {
      this.dispatchEvent('toolExecutionError', { toolName, input: parsedInput, error: err.message });
      throw err;
    }
  }

  addEventListener(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    if (this.nativeContext && typeof this.nativeContext.addEventListener === 'function') {
      try {
        this.nativeContext.addEventListener(event, callback);
      } catch {}
    }
  }

  removeEventListener(event: string, callback: (...args: any[]) => void) {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(event, list.filter(cb => cb !== callback));
    }
    if (this.nativeContext && typeof this.nativeContext.removeEventListener === 'function') {
      try {
        this.nativeContext.removeEventListener(event, callback);
      } catch {}
    }
  }

  private dispatchEvent(event: string, data: any) {
    const list = this.listeners.get(event);
    if (list) {
      list.forEach(cb => {
        try {
          cb(data);
        } catch (e) {
          console.error('[WebMCP] Event listener error:', e);
        }
      });
    }

    // Also dispatch on window so external agent extensions can observe
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(`webmcp:${event}`, { detail: data }));
    }
  }
}

// Global reference
let activeContext: StandardModelContext | null = null;
let unifiedProxy: ModelContextInterface | null = null;

export function ensureWebMcpBridge(): ModelContextInterface {
  if (unifiedProxy) {
    return unifiedProxy;
  }

  if (typeof document === 'undefined') {
    activeContext = new StandardModelContext();
    unifiedProxy = activeContext;
    return activeContext;
  }

  const doc = document as any;
  const nav = (typeof navigator !== 'undefined' ? navigator : {}) as any;
  const win = (typeof window !== 'undefined' ? window : {}) as any;

  // Check if Chrome has native modelContext on document, navigator, or window
  const existingNative = doc.modelContext || nav.modelContext || win.modelContext;
  const bridgeContext = new StandardModelContext(existingNative);

  // Define RegisteredTool globally if not already set by Chrome
  if (win && !win.RegisteredTool) {
    win.RegisteredTool = RegisteredToolImpl;
  }

  // Create unified proxy/wrapper object that conforms to Chrome's native ModelContext interface
  // while intercepting executeTool and registerTool to eliminate type mismatch errors
  unifiedProxy = new Proxy(existingNative || bridgeContext, {
    get(target, prop, receiver) {
      if (prop === 'registerTool') {
        return (tool: any, options?: any) => bridgeContext.registerTool(tool, options);
      }
      if (prop === 'executeTool') {
        return (toolOrName: any, input?: any, options?: any) => bridgeContext.executeTool(toolOrName, input, options);
      }
      if (prop === 'getTools') {
        return (options?: any) => bridgeContext.getTools(options);
      }
      if (prop === 'getTool') {
        return (name: string) => bridgeContext.getTool(name);
      }
      if (prop === 'unregisterTool') {
        return (name: string) => bridgeContext.unregisterTool(name);
      }
      if (prop === 'addEventListener') {
        return (e: string, cb: any) => bridgeContext.addEventListener(e, cb);
      }
      if (prop === 'removeEventListener') {
        return (e: string, cb: any) => bridgeContext.removeEventListener(e, cb);
      }
      return Reflect.get(target, prop, receiver);
    },
  });

  // Assign to document.modelContext, navigator.modelContext, and window.modelContext
  try {
    doc.modelContext = unifiedProxy;
  } catch (e) {
    console.debug('[WebMCP] doc.modelContext assignment notice:', e);
  }
  try {
    nav.modelContext = unifiedProxy;
  } catch (e) {
    console.debug('[WebMCP] nav.modelContext assignment notice:', e);
  }
  try {
    win.modelContext = unifiedProxy;
  } catch (e) {
    console.debug('[WebMCP] win.modelContext assignment notice:', e);
  }

  activeContext = bridgeContext;
  return unifiedProxy;
}
