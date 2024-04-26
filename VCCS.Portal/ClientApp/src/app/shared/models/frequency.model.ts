export class Frequency {
  id!: string;
  channel!: string;
  isSelected!: boolean;

  constructor(id: string, channel: string) {
    this.id = channel === 'TF' ? id : `${channel}-${id}` ;
    this.channel = channel;
    this.isSelected = false;
  }
}
