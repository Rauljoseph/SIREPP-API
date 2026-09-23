export interface EventPublisherPort {
  publicar(evento: string, payload: Record<string, unknown>): Promise<void>;
}

export const EVENT_PUBLISHER = Symbol('EventPublisherPort');