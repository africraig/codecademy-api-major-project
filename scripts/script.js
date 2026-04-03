const API_KEY = "ADD YOUR API KEY HERE";

let portfolio = JSON.parse(localStorage.getItem("portfolio")) || [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

function renderPortfolio() {
    const list = document.getElementById('portfolioList');
    list.textContent = "";

    portfolio.forEach(stock => {
        const div = document.createElement('div');
        div.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'p-2', 'border');

        div.innerHTML = `
      <div class="col-3 d-flex align-items-center flex-fill">${stock.companyName} (${stock.companyTicker})</div>
      <div class="col-2 d-flex align-items-center flex-fill">Stock Price: $${stock.price.toFixed(2)}</div>
      <div class="d-flex align-items-center flex-fill"><input type="number" min="1" value="${stock.shares}" class="totalValue"></div>
      <div class="d-flex align-items-center localvalue flex-fill justify-content-start">Value: 
        $${stock.localvalue ? stock.localvalue.toFixed(2) : (stock.price * stock.shares).toFixed(2)}
      </div>
      <button class="btn btn-sm btn-danger">Delete</button>
    `;

        const sharesInput = div.querySelector('input');
        const totalValueSpan = div.querySelector('.totalValue');
        const localvalue = div.querySelector('.localvalue');

        sharesInput.addEventListener('change', (event) => {
            let newShares = parseInt(event.target.value);
            if (isNaN(newShares) || newShares < 1) newShares = 1;

            stock.shares = newShares;
            stock.localvalue = stock.price * stock.shares;

            totalValueSpan.textContent = (stock.price * stock.shares).toFixed(2);
            localvalue.textContent = `Value: $${stock.localvalue.toFixed(2)}`;
            localStorage.setItem('portfolio', JSON.stringify(portfolio));
            updatePortfolioValue();
        });

        div.querySelector('button').addEventListener('click', () => {
            portfolio = portfolio.filter(item => item.companyTicker !== stock.companyTicker);
            localStorage.setItem('portfolio', JSON.stringify(portfolio));
            renderPortfolio();
            updatePortfolioValue();
        });

        list.appendChild(div);
    });

    updatePortfolioValue();
}

function updatePortfolioValue() {
    const totalValue = portfolio.reduce((sum, stock) => sum + stock.price * stock.shares, 0);
    document.getElementById('total').textContent = `$${totalValue.toFixed(2)}`;
    localStorage.setItem('portfolioValue', JSON.stringify(totalValue));
}

function renderWatchlist() {
    const list = document.getElementById('watchlist');
    list.textContent = "";

    watchlist.forEach(stock => {
        const div = document.createElement('div');
        div.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2', 'p-2', 'border');

        div.innerHTML = `
      <div class="col-1 d-flex align-items-center flex-fill">${stock.companyName} (${stock.companyTicker})</div>
      <div class="col-1 d-flex align-items-center flex-fill">Stock Price: $${stock.price}</div>
      <button class="btn btn-sm btn-danger">Delete</button>
    `;

        div.querySelector('button').addEventListener('click', () => {
            watchlist = watchlist.filter(item => item.companyTicker !== stock.companyTicker);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            renderWatchlist();
        });
        list.appendChild(div);
    });
}

function addToPortfolio() {
    const companyName = document.getElementById('companyName').textContent;
    const companyTicker = document.getElementById('companyTicker').textContent;
    const price = parseFloat(document.getElementById('stockPrice').textContent.slice(1));

    if (!companyTicker || !price) return;

    const exists = portfolio.find(item => item.companyTicker === companyTicker);
    if (!exists) {
        portfolio.push({ companyName, companyTicker, price, shares: 1, localvalue: price });
    }

    localStorage.setItem('portfolio', JSON.stringify(portfolio));
    renderPortfolio();
}

function addToWatchlist() {
    const companyName = document.getElementById('companyName').textContent;
    const companyTicker = document.getElementById('companyTicker').textContent;
    const price = parseFloat(document.getElementById('stockPrice').textContent.slice(1));

    if (!companyTicker || !price) return;

    const exists = watchlist.find(item => item.companyTicker === companyTicker);
    if (!exists) {
        watchlist.push({ companyName, companyTicker, price });
    }
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    renderWatchlist();
}

async function lookupStock(query) {
    const searchRes = await fetch(`https://finnhub.io/api/v1/search?q=${query}&token=${API_KEY}`);
    const searchData = await searchRes.json();

    if (!searchData.result || searchData.result.length === 0) return;

    const firstMatch = searchData.result[0];
    document.getElementById('companyName').textContent = firstMatch.description;
    document.getElementById('companyTicker').textContent = firstMatch.symbol;

    const changeElement = document.getElementById('priceChangeElement');

    try {
        const quoteRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${firstMatch.symbol}&token=${API_KEY}`);
        if (quoteRes.ok) { // This API sometimes responds with 403 for certain stocks.
            const quoteData = await quoteRes.json();

            document.getElementById('stockPrice').textContent = `$${quoteData.c.toFixed(2)}`;
            document.getElementById('open').textContent = quoteData.o.toFixed(2);
            document.getElementById('high').textContent = quoteData.h.toFixed(2);
            document.getElementById('low').textContent = quoteData.l.toFixed(2);
            document.getElementById('volume').textContent = quoteData.t;

            changeElement.textContent = `${quoteData.dp >= 0 ? '+' : ''}${quoteData.dp.toFixed(2)}%`;
            changeElement.className = `badge ${quoteData.dp >= 0 ? 'bg-success' : 'bg-danger'}`;

        } else {
            document.getElementById('stockPrice').textContent = `$0.00`;
            document.getElementById('open').textContent = 0;
            document.getElementById('high').textContent = 0;
            document.getElementById('low').textContent = 0;
            document.getElementById('volume').textContent = 0;

            changeElement.textContent = '0%';
            changeElement.className = 'badge bg-secondary';
            return
        }
    } catch (error) {
        console.error(`ERROR:  + ${error}`);
    }
};

async function handleSearch() {
    const query = document.getElementById('search'.toString()).value.trim();
    if (!query) return;
    await lookupStock(query);
    document.getElementById('search').value = '';
}

document.addEventListener("readystatechange", (event) => {
    if (event.target.readyState === "complete") {
        const searchBtn = document.getElementById("searchBtn");
        const watchlistBtn = document.getElementById("watchlistBtn");
        const portfolioBtn = document.getElementById("portfolioBtn");

        searchBtn.addEventListener("click", handleSearch);
        watchlistBtn.addEventListener("click", addToWatchlist);
        portfolioBtn.addEventListener("click", addToPortfolio);

        document.getElementById("search").addEventListener("keypress", (event) => {
            if (event.key === "Enter") {
                handleSearch();
            }

        });
        renderPortfolio();
        renderWatchlist();
    }
});
