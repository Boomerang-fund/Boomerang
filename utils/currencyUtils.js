function getProjectCurrencySymbol(currency) {
    const currencySymbols = { USD: "$", THB: "฿" };
    return currencySymbols[currency] || currency;
}

function getExchangeRates(userCurrency, projectCurrency, projectAmount, exchangeRates) {
    return (projectAmount * (exchangeRates.data[userCurrency] / exchangeRates.data[projectCurrency])).toFixed(2);
}

module.exports = {
    getProjectCurrencySymbol,
    getExchangeRates
};