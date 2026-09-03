/**
 * WebMCP Context Bridge & Standards Polyfill
 * Ensures `document.modelContext.registerTool` is fully functional and standards-compliant
 * across all modern browsers and WebMCP agent runtimes.
 */

import { WebMCPToolDefinition } from '../types.ts';

export interface ModelContextInterface {
  registerTool(tool: WebMCPToolDefinition): void;
  unregisterTool(name: string): boolean;
  getTool(name: string): WebMCPToolDefinition | undefined;
  getTools(): WebMCPToolDefinition[];
  executeTool(name: string, input: any): Promise<any>;
  addEventListener(event: string, callback: (...args: any[]) => void): void;
  removeEventListener(event: string, callback: (...args: any[]) => void): void;
}

class StandardModelContext implements ModelContextInterface {
  private tools: Map<string, WebMCPToolDefinition> = new Map();
  private listeners: Map<string, Array<(...args: any[]) => void>> = new Map();

  registerTool(tool: WebMCPToolDefinition) {
    if (!tool.name || typeof tool.name !== 'string') {
      throw new Error('WebMCP Error: Tool must provide a valid string name');
    }
    if (!tool.execute || typeof tool.execute !== 'function') {
      throw new Error(`WebMCP Error: Tool "${tool.name}" must provide an execute handler`);
    }

    this.tools.set(tool.name, tool);
    this.dispatchEvent('toolRegistered', { toolName: tool.name, definition: tool });
    console.log(`[WebMCP] Registered tool: ${tool.name} (Approval Gated: ${Boolean(tool.requiresApproval)})`);
  }

  unregisterTool(name: string): boolean {
    const deleted = this.tools.delete(name);
    if (deleted) {
      this.dispatchEvent('toolUnregistered', { toolName: name });
    }
    return deleted;
  }

  getTool(name: string): WebMCPToolDefinition | undefined {
    return this.tools.get(name);
  }

  getTools(): WebMCPToolDefinition[] {
    return Array.from(this.tools.values());
  }

  async executeTool(name: string, input: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`[WebMCP] Execution error: Tool "${name}" is not registered.`);
    }

    this.dispatchEvent('toolExecutionStart', { toolName: name, input });
    try {
      const result = await tool.execute(input);
      this.dispatchEvent('toolExecutionSuccess', { toolName: name, input, result });
      return result;
    } catch (err: any) {
      this.dispatchEvent('toolExecutionError', { toolName: name, input, error: err.message });
      throw err;
    }
  }

  addEventListener(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeEventListener(event: string, callback: (...args: any[]) => void) {
    const list = this.listeners.get(event);
    if (list) {
      this.listeners.set(event, list.filter(cb => cb !== callback));
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

// Attach document.modelContext standard
let nodeSingletonContext: ModelContextInterface | null = null;

export function ensureWebMcpBridge(): ModelContextInterface {
  if (typeof document === 'undefined') {
    if (!nodeSingletonContext) {
      nodeSingletonContext = new StandardModelContext();
    }
    return nodeSingletonContext;
  }

  const doc = document as any;

  if (!doc.modelContext) {
    doc.modelContext = new StandardModelContext();
  } else if (!doc.modelContext.getTools) {
    // If browser provides raw registerTool only, augment it
    const originalRegister = doc.modelContext.registerTool.bind(doc.modelContext);
    const context = new StandardModelContext();
    const originalToolsMap = new Map<string, any>();

    doc.modelContext.registerTool = (tool: any) => {
      originalToolsMap.set(tool.name, tool);
      context.registerTool(tool);
      try {
        originalRegister(tool);
      } catch (e) {
        // Safe if underlying browser has differing signature
      }
    };
    doc.modelContext.getTools = () => context.getTools();
    doc.modelContext.getTool = (n: string) => context.getTool(n);
    doc.modelContext.executeTool = (n: string, i: any) => context.executeTool(n, i);
    doc.modelContext.addEventListener = (e: string, cb: any) => context.addEventListener(e, cb);
    doc.modelContext.removeEventListener = (e: string, cb: any) => context.removeEventListener(e, cb);
  }

  return doc.modelContext as ModelContextInterface;
}
