export interface EventoHandler {
  handle(data: Record<string, unknown>): Promise<void>;
}