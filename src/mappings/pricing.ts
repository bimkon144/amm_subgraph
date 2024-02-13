/* eslint-disable prefer-const */
import { Pair, Token, Bundle } from '../../generated/schema'
import { BigDecimal, Address, BigInt } from '@graphprotocol/graph-ts/index'
import { ZERO_BD, factoryContract, ADDRESS_ZERO, ONE_BD, UNTRACKED_PAIRS } from './helpers'
import {log} from "@graphprotocol/graph-ts";

// TODO: update address
const WETH_ADDRESS = '0x980b62da83eff3d4576c647993b0c1d7faf17c73'
const USDC_WETH_PAIR = '0x35142e6410a060546f89fe5dc865eb13fdff5514'

export function getEthPriceInUSD(): BigDecimal {
  // fetch eth prices for each stablecoin
  let usdcPair = Pair.load(USDC_WETH_PAIR) // usdc is token0

  if (usdcPair !== null) {
    return usdcPair.token1Price
  } else {
    return ZERO_BD
  }
}

// token where amounts should contribute to tracked volume and liquidity
let WHITELIST: string[] = [
// TODO: update address
  '0x980b62da83eff3d4576c647993b0c1d7faf17c73', // WETH
  '0xb893e3334d4bd6c5ba8277fd559e99ed683a9fc7', // USDC
]

let STABLE = '0xb893e3334d4bd6c5ba8277fd559e99ed683a9fc7'

// minimum liquidity required to count towards tracked volume for pairs with small # of Lps
let MINIMUM_USD_THRESHOLD_NEW_PAIRS = BigDecimal.fromString('500')

// minimum liquidity for price to get trackedc
let MINIMUM_LIQUIDITY_THRESHOLD_ETH = BigDecimal.fromString('0.5')

// minimum liquidity to stop trying to get biggest pair
let MINIMUM_LIQUIDITY_ETH = BigDecimal.fromString('50')

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
    let pair =  Pair.load(USDC_WETH_PAIR)
    if(pair) {
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
        (pair.token0 == token.id && WHITELIST.includes(pair.token1)) ||
        (pair.token1 == token.id && WHITELIST.includes(pair.token0)))
    {
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
