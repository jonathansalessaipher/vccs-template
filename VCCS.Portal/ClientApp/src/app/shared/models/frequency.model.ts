export class Frequency {
  id!: string;
  channel!: string;
  isSelected!: boolean;
  connectionId!: string;
  onCall!: boolean;

  // micActive: boolean = false;
  // audioActive: boolean = false;

  constructor(id: string, channel: string, connectionId: string = '') {
    this.id = channel === 'TF' ? id : `${channel}-${id}` ;
    this.channel = channel;
    this.isSelected = false;
    this.connectionId = connectionId;
    this.onCall = false;
  }
}
