// import {
//   FeePercentOwnershipTransferred as FeePercentOwnershipTransferredEvent,
//   FeeToTransferred as FeeToTransferredEvent,
//   OwnerFeeShareUpdated as OwnerFeeShareUpdatedEvent,
//   OwnershipTransferred as OwnershipTransferredEvent,
//   PairCreated as PairCreatedEvent,
//   ReferrerFeeShareUpdated as ReferrerFeeShareUpdatedEvent,
//   SetStableOwnershipTransferred as SetStableOwnershipTransferredEvent
// } from "../generated/Factory/Factory"
// import {
//   FeePercentOwnershipTransferred,
//   FeeToTransferred,
//   OwnerFeeShareUpdated,
//   OwnershipTransferred,
//   PairCreated,
//   ReferrerFeeShareUpdated,
//   SetStableOwnershipTransferred
// } from "../generated/schema"
//
// export function handleFeePercentOwnershipTransferred(
//   event: FeePercentOwnershipTransferredEvent
// ): void {
//   let entity = new FeePercentOwnershipTransferred(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.prevOwner = event.params.prevOwner
//   entity.newOwner = event.params.newOwner
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handleFeeToTransferred(event: FeeToTransferredEvent): void {
//   let entity = new FeeToTransferred(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.prevFeeTo = event.params.prevFeeTo
//   entity.newFeeTo = event.params.newFeeTo
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handleOwnerFeeShareUpdated(
//   event: OwnerFeeShareUpdatedEvent
// ): void {
//   let entity = new OwnerFeeShareUpdated(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.prevOwnerFeeShare = event.params.prevOwnerFeeShare
//   entity.ownerFeeShare = event.params.ownerFeeShare
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handleOwnershipTransferred(
//   event: OwnershipTransferredEvent
// ): void {
//   let entity = new OwnershipTransferred(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.prevOwner = event.params.prevOwner
//   entity.newOwner = event.params.newOwner
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handlePairCreated(event: PairCreatedEvent): void {
//   let entity = new PairCreated(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.token0 = event.params.token0
//   entity.token1 = event.params.token1
//   entity.pair = event.params.pair
//   entity.length = event.params.length
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handleReferrerFeeShareUpdated(
//   event: ReferrerFeeShareUpdatedEvent
// ): void {
//   let entity = new ReferrerFeeShareUpdated(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.referrer = event.params.referrer
//   entity.prevReferrerFeeShare = event.params.prevReferrerFeeShare
//   entity.referrerFeeShare = event.params.referrerFeeShare
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
//
// export function handleSetStableOwnershipTransferred(
//   event: SetStableOwnershipTransferredEvent
// ): void {
//   let entity = new SetStableOwnershipTransferred(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   )
//   entity.prevOwner = event.params.prevOwner
//   entity.newOwner = event.params.newOwner
//
//   entity.blockNumber = event.block.number
//   entity.blockTimestamp = event.block.timestamp
//   entity.transactionHash = event.transaction.hash
//
//   entity.save()
// }
