/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../../generated/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, UNTRACKED_PAIRS } from './helpers'
import {log} from "@graphprotocol/graph-ts";

// TODO: update address
const WETH_ADDRESS = '0x8f7bda6286a9eeb70a74a9b0321bbdd1861bedfb'
const USDT_WETH_PAIR = '0xf685dd2e0a77a1455b61df91241949e24646e69a'
const USDС_WETH_PAIR = '0xbed1ed3d8df7f0aa9062945b6d3874976c769fc6'
const DAI_WETH_PAIR = '0x39ad59c726ccb0b47fbf0d1ed60f94b9bce96ebe'

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdtPair = Pair.load(USDT_WETH_PAIR) // usdt is token0

  if (usdtPair !== null) {
    log.info('USDT PAIR NOT NULL: {}', [USDT_WETH_PAIR]);
    return usdtPair.token1Price
  } else {
    log.info('USDT PAIR NULL: {}', [USDT_WETH_PAIR]);
    return BigDecimal.fromString('51')
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
// TODO: update address
  '0x8f7bda6286a9eeb70a74a9b0321bbdd1861bedfb', // WETH
  '0x9ca63241c2ec31f0c40d1372d4236172c5499a1f', // WBTC
  '0x62e783a3d22fb66ef6868501d399c9644d421930', // DAI
  '0xd6c40f45a617be25d2847f83a422aa82d2077350', // USDC
  '0xb5e18d66f2f0a1e7b8eb51e48b57b2d1ba707e91', // USDT
  '0xad0cfd3e2d2bf143bc5266ee1f4a7505f5750143', // ARB
  '0xf9ce31898b8b2ca44de016fed5bf90adc43311b9', // OP
  '0x63aef2806936fe54240fca6370c2b0ebc11951d2', // DOGE
  '0xa724685f1a9f46e44e1f873b60e59ffbf83063fa', // PEPE
]

let STABLE = '0xb5e18d66f2f0a1e7b8eb51e48b57b2d1ba707e91'
let STABLE_USDC = '0xd6c40f45a617be25d2847f83a422aa82d2077350'
let STABLE_DAI = '0x62e783a3d22fb66ef6868501d399c9644d421930'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('10')

// minimum liquidity for price to get trackedc
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0.1')

// minimum liquidity to stop trying to get biggest pair
let MINIMUM_LIQUIDITY_ETH = BigDecimal.fromString('0.1')

/**
 * Search through graph to find derived Eth per token.
 * @todo update to be derived ETH (add stablecoin estimates)
 **/
export function findEthPerToken(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }

  let price = ZERO_BD
  let lastPairReserveETH = MINIMUM_LIQUIDITY_THRESHOLD_ETH

  // loop through whitelist and check if paired with any
  for (let i = 0; i < WHITELIST.length; ++i) {
    let pairAddress = factoryContract.getPair(Address.fromString(token.id), Address.fromString(WHITELIST[i]))
    if (pairAddress.toHexString() != ADDRESS_ZERO) {
      let pair = Pair.load(pairAddress.toHexString())
      if(!pair) continue
      if (pair.token0 == token.id && pair.reserveETH.gt(lastPairReserveETH)) {
        let token1 = Token.load(pair.token1) as Token
        lastPairReserveETH = pair.reserveETH
        price = pair.token1Price.times(token1.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id && pair.reserveETH.gt(lastPairReserveETH)) {
        let token0 = Token.load(pair.token0) as Token
        lastPairReserveETH = pair.reserveETH
        price = pair.token0Price.times(token0.derivedETH as BigDecimal) // return token0 per our token * ETH per token 0
      }

      if(lastPairReserveETH.ge(MINIMUM_LIQUIDITY_ETH)) {
        return price
      }
    }
  }
  return price // nothing was found return 0
}

export function findEthPerTokenWithoutCall(token: Token): BigDecimal {
  if (token.id == WETH_ADDRESS) {
    return ONE_BD
  }

  let price = ZERO_BD
  let lastPairReserveETH = MINIMUM_LIQUIDITY_THRESHOLD_ETH


  if(token.id == STABLE) {
    let pair =  Pair.load(USDT_WETH_PAIR)
 
    if(pair) {
      let token0 = Token.load(pair.token0) as Token
      price = pair.token0Price.times(token0.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      return price
    }
  }

  if (token.id == STABLE_USDC) {
    let pair =  Pair.load(USDС_WETH_PAIR)
 
    if(pair) {
      let token0 = Token.load(pair.token0) as Token
      price = pair.token0Price.times(token0.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      return price
    }
  }
  if (token.id == STABLE_DAI) {
    let pair =  Pair.load(DAI_WETH_PAIR)
    log.info('DAI PAIR ENTERED but not exist: {}', ['pair']);
    if(pair) {
      log.info('DAI PAIR ENTERED: {}', [pair.id]);
      let token0 = Token.load(pair.token0) as Token
      price = pair.token0Price.times(token0.derivedETH as BigDecimal) // return token1 per our token * Eth per token 1
      return price
    }
  }

  for (let i = 0; i < token.allPairs.length; ++i) {
    let pairAddress = token.allPairs[i]
    let pair = Pair.load(pairAddress)
    if(!pair) continue // should never happen
    if(
        (pair.token0 == token.id && pair.token1 == WETH_ADDRESS) ||
        (pair.token1 == token.id && pair.token0 == WETH_ADDRESS))
    {
      log.info('Message to be displayed: {}, {}, {}', [token.id, pair.token0, pair.token1])
      log.info('Message to be displayed: {}, {}, {}', [(pair.reserveETH).toString(), (lastPairReserveETH).toString(), (pair.token0 == token.id).toString()])
      if (pair.token0 == token.id) {
        log.info('Message Inside0: {}, {}, {}', [token.id, pair.token0, pair.token1])
        log.info('Pair.token0-reserveETH: {}', [(pair.reserveETH).toString()]);
        log.info('Pair.token0-LastPairReverveETH: {}', [(lastPairReserveETH).toString()]);
  
        price = pair.token1Price // return token1 per our token * Eth per token 1
      }
      if (pair.token1 == token.id) {
        log.info('Message Inside1: {}, {}, {}', [token.id, pair.token0, pair.token1])
        log.info('Pair.token1-reserveETH: {}', [(pair.reserveETH).toString()]);
        log.info('Pair.token1-LastPairReverveETH: {}', [(lastPairReserveETH).toString()]);

        price = pair.token0Price // return token0 per our token * ETH per token 0
      }
    }
  }
  return price
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD.
 * If both are, return average of two amounts
 * If neither is, return 0
 */
export function getTrackedVolumeUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  pair: Pair
): BigDecimal {
  let bundle = Bundle.load('1') as Bundle
  let price0 = (token0.derivedETH as BigDecimal).times(bundle.ethPrice)
  let price1 = (token1.derivedETH as BigDecimal).times(bundle.ethPrice)

  // d'ont count tracked volume on these pairs - usually rebass tokens
  if (UNTRACKED_PAIRS.includes(pair.id)) {
    return ZERO_BD
  }

  // if less than 5 LPs, require high minimum reserve amount or return 0
  if (pair.liquidityProviderCount.lt(BigInt.fromI32(5))) {
    let reserve0USD = pair.reserve0.times(price0)
    let reserve1USD = pair.reserve1.times(price1)
    if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if (reserve0USD.plus(reserve1USD).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
      if (reserve0USD.times(BigDecimal.fromString('2')).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
    if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
      if (reserve1USD.times(BigDecimal.fromString('2')).lt(MINIMUM_USD_THRESHOLD_NEW_PAIRS)) {
        return ZERO_BD
      }
    }
  }

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0
      .times(price0)
      .plus(tokenAmount1.times(price1))
      .div(BigDecimal.fromString('2'))
  }

  // take full value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0)
  }

  // take full value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1)
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}

/**
 * Accepts tokens and amounts, return tracked amount based on token whitelist
 * If one token on whitelist, return amount in that token converted to USD * 2.
 * If both are, return sum of two amounts
 * If neither is, return 0
 */
export function getTrackedLiquidityUSD(
  tokenAmount0: BigDecimal,
  token0: Token,
  tokenAmount1: BigDecimal,
  token1: Token,
  bundle: Bundle
): BigDecimal {
  let price0 = (token0.derivedETH as BigDecimal).times(bundle.ethPrice)
  let price1 = (token1.derivedETH as BigDecimal).times(bundle.ethPrice)

  // both are whitelist tokens, take average of both amounts
  if (WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).plus(tokenAmount1.times(price1))
  }

  // take double value of the whitelisted token amount
  if (WHITELIST.includes(token0.id) && !WHITELIST.includes(token1.id)) {
    return tokenAmount0.times(price0).times(BigDecimal.fromString('2'))
  }

  // take double value of the whitelisted token amount
  if (!WHITELIST.includes(token0.id) && WHITELIST.includes(token1.id)) {
    return tokenAmount1.times(price1).times(BigDecimal.fromString('2'))
  }

  // neither token is on white list, tracked volume is 0
  return ZERO_BD
}
