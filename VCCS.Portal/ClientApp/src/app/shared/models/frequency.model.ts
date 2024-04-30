export class Frequency {
  id!: string;
  channel!: string;
  isSelected!: boolean;
  connectionId!: string;

  constructor(id: string, channel: string, connectionId: string = '') {
    this.id = channel === 'TF' ? id : `${channel}-${id}` ;
    this.channel = channel;
    this.isSelected = false;
    this.connectionId = connectionId;
  }
}
