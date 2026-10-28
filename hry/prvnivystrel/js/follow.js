export class TeamFollow {
  constructor(center) {
    this.center = center;
    this.teamId = null;
  }

  select(id, position = null) {
    this.teamId = id;
    if (position) this.center(position);
  }

  stop() {
    this.teamId = null;
  }

  retain(selected) {
    if (this.teamId !== null && !selected.has(this.teamId)) this.stop();
  }

  update(active) {
    if (this.teamId === null) return;
    const tracked = active.find(a => a.t.id === this.teamId);
    if (tracked) this.center(tracked.p);
  }
}
