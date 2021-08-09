// This source code is subject to the terms of the Mozilla Public License 2.0 at https://mozilla.org/MPL/2.0/
// © aofwittawat

//@version=4
strategy("STO RSI EMA-ATR PYBOT", overlay=true )

// A. all input variable from USERs
EMA_SHORT = input( title = "EMA_SHORT", type = input.integer, defval = 8, group = "EMA CONFIG")
EMA_MIDDLE = input( title = "EMA_MIDDLE", type = input.integer, defval = 14, group = "EMA CONFIG")
EMA_LONG = input( title = "EMA_LONG", type = input.integer, defval = 50 , group = "EMA CONFIG")

RSI_LENGTH = input( title = "RSI_LENGTH", type = input.integer, defval=14, group = "RSI CONFIG")
STO_LENGTH = input(14, "Stochastic Length", minval=1, group = "RSI CONFIG")
SMOOTH_K = input(3, "SMOOTH_K", minval=1, group = "RSI CONFIG")
SMOOTH_D = input(3, "SMOOTH_D", minval=1, group = "RSI CONFIG")

ATR_LENGTH = input(title="ATR_LENGTH ", defval=14, minval=1, group = "ATR CONFIG")
ATR_SMOOTING = input(title="ATR_SMOOTING", defval="RMA", options=["RMA", "SMA", "EMA", "WMA"], group = "ATR CONFIG")
ATR_MULTIPLY_SL = input( title = "ATR_MULTIPLY_SL", type = input.integer, defval=3, group = "ATR CONFIG")
ATR_MULTIPLY_TP = input( title = "ATR_MULTIPLY_TP", type = input.integer, defval=6, group = "ATR CONFIG")

// B. Create EMA from input
EMA_SHORT_LINE = ema(close, EMA_SHORT)
EMA_MIDDLE_LINE = ema(close, EMA_MIDDLE)
EMA_LONG_LINE = ema(close, EMA_LONG)

plot(EMA_SHORT_LINE , "EMA_SHORT_LINE ", color=color.red)
plot(EMA_MIDDLE_LINE , "EMA_MIDDLE_LINE ", color=color.blue)
plot(EMA_LONG_LINE , "EMA_LONG_LINE ", color=color.green)


// C. Create STO_RSI
rsi1 = rsi(close, RSI_LENGTH)
k = sma(stoch(rsi1, rsi1, rsi1, STO_LENGTH), SMOOTH_K)
d = sma(k, SMOOTH_D)

plotchar(k, "SMOOTH_K", char =" ")
plotchar(d, "SMOOTH_D", char =" ")


// D. ATR14
ma_function(source, length) =>
	if ATR_SMOOTING == "RMA"
		rma(source, length)
	else
		if ATR_SMOOTING == "SMA"
			sma(source, length)
		else
			if ATR_SMOOTING == "EMA"
				ema(source, length)
			else
				wma(source, length)

ATR_VALUE = ma_function(tr(true), ATR_LENGTH)
plotchar(ATR_VALUE, "ATR_VALUE", char= " ")


// E. Signal detection
// wait until RSI STO crossUP or down ; 1 = long, 2 = short, 0 = long
RSI_SIGNALS = crossover(k,d) ? 1 : crossunder(k,d) ? 2 : 0
plotchar(RSI_SIGNALS, "RSI_SIGNALS", char=" ")

// F. Pattern detection 
    // EMA pattern
ATR_SL = 0.0
ATR_TP = 0.0
EMA_SIGNALS = 0
if EMA_SHORT_LINE > EMA_MIDDLE_LINE and EMA_MIDDLE_LINE > EMA_LONG_LINE
    if close > EMA_SHORT_LINE
        EMA_SIGNALS := 1
        ATR_SL := close - (ATR_VALUE * ATR_MULTIPLY_SL)
        ATR_TP := close + (ATR_VALUE * ATR_MULTIPLY_TP)
        
if EMA_SHORT_LINE < EMA_MIDDLE_LINE and EMA_MIDDLE_LINE < EMA_LONG_LINE
    if close < EMA_SHORT_LINE
        EMA_SIGNALS := 2
        ATR_SL := close + (ATR_VALUE * ATR_MULTIPLY_SL)
        ATR_TP := close - (ATR_VALUE * ATR_MULTIPLY_TP)
plotchar(EMA_SIGNALS, "EMA_SIGNALS", char=" ")
plotchar(ATR_SL, "ATR_SL", char=" ")
plotchar(ATR_TP, "ATR_TP", char=" ")

// G. Create Position
// Long position
SUMMARY_SIGNALS = RSI_SIGNALS == 1 and EMA_SIGNALS == 1 ? "LONG" : RSI_SIGNALS == 2 and EMA_SIGNALS == 2 ? "SHORT" : "WAIT"
if SUMMARY_SIGNALS == "LONG"
    strategy.close("SHORT")
    strategy.entry(id="LONG", long=true)
    strategy.exit(id= "EX LONG", from_entry = "LONG", profit = ATR_TP, stop = ATR_SL)
if SUMMARY_SIGNALS == "SHORT"
    strategy.close("LONG")
    strategy.entry(id="SHORT", long=false)
    strategy.exit(id= "EX SHORT", from_entry = "SHORT", profit = ATR_TP, stop = ATR_SL)
    
// CHECK position others
