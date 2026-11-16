export enum EstadoPlacaPublica {
  /** La placa fue reportada como extraviada/robada — está en búsqueda */
  EN_BUSQUEDA = 'EN_BUSQUEDA',

  /** La placa fue encontrada y está bajo custodia policial */
  EN_CUSTODIA = 'EN_CUSTODIA',

  /** La placa fue encontrada y coincide con un encargo — disponible para retiro */
  DISPONIBLE_PARA_RETIRO = 'DISPONIBLE_PARA_RETIRO',

  /** La placa ya fue entregada a su propietario */
  ENTREGADA = 'ENTREGADA',
}