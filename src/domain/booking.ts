export type BookingStatus='pending'|'confirmed'|'checked_in'|'in_progress'|'completed'|'cancelled'|'rejected'|'no_show'|'expired';
export type Interval={startAt:Date;endAt:Date};
export const reservingStatuses:BookingStatus[]=['pending','confirmed','checked_in','in_progress'];
export const transitions:Record<BookingStatus,BookingStatus[]>={
 pending:['confirmed','rejected','cancelled','expired'], confirmed:['checked_in','cancelled','no_show'], checked_in:['in_progress','cancelled'], in_progress:['completed','cancelled'], completed:[], cancelled:[], rejected:[], no_show:[], expired:[]
};
export function overlaps(a:Interval,b:Interval){return a.startAt<b.endAt&&a.endAt>b.startAt}
export function appointmentEnd(startAt:Date,durationMinutes:number,bufferMinutes=0){return new Date(startAt.getTime()+(durationMinutes+bufferMinutes)*60_000)}
export function canTransition(from:BookingStatus,to:BookingStatus){return transitions[from].includes(to)}
export function assertBookable(startAt:Date,endAt:Date,now=new Date()){if(startAt<=now)throw new Error('PAST_SLOT');if(endAt<=startAt)throw new Error('INVALID_INTERVAL')}
