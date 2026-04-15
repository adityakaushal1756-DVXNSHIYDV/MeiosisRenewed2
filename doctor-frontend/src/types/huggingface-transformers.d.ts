declare module '@huggingface/transformers' {
  export const env: {
    backends: {
      onnx: {
        wasm?: {
          proxy?: boolean;
          numThreads?: number;
        };
      };
    };
  };

  export function pipeline(
    task: string,
    model: string,
    options?: Record<string, unknown>
  ): Promise<(...args: unknown[]) => Promise<unknown>>;
}
