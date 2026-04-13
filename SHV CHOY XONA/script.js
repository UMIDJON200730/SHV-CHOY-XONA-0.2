// ---------------- LOCALSTORAGE ----------------
let menu = JSON.parse(localStorage.getItem('milliy_menu_v2')) || [
    { id: 1, name: "Xonalar", price: 180000, isRoom: true },
    { id: 2, name: "Osh 1kg", price: 430000, img: "https://data.kaktus.media/image/big/2016-06-08_11-47-09_987414.jpg" },
    { id: 3, name: "Suzma", price: 5000, img: "https://www.ceyhandurum.com.tr/wp-content/uploads/2016/01/haydari.jpg" },
    { id: 4, name: "Svejiy Salat", price: 10000, img: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500" },
    { id: 5, name: "Non", price: 4000, img: "https://cdn-kz3.foodpicasso.com/assets/2023/09/02/a864429271ec1981edd07d816d0ae80b---jpeg_1000x_103c0_convert.jpeg" }
];

let db = JSON.parse(localStorage.getItem('milliy_db_v2')) || {};
let journal = JSON.parse(localStorage.getItem('milliy_journal_v2')) || [];
let selectedRoom = 1;

// ---------------- INIT ----------------
window.onload = () => {
    initRooms();
    selectRoom(1);
};

// ---------------- LOGIN ----------------
function showSection(type) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-app').style.display = 'block';

    document.getElementById('service-section').style.display = type === 'service' ? 'flex' : 'none';
    document.getElementById('cashier-section').style.display = type === 'cashier' ? 'block' : 'none';

    if(document.getElementById('cashier-stats')) {
        document.getElementById('cashier-stats').style.display = type === 'cashier' ? 'block' : 'none';
    }

    if(type === 'cashier') renderCashier();
}

function goHome() {
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('main-app').style.display = 'none';
}

function checkPass() {
    if(prompt("Kassa paroli:") === "1") showSection('cashier');
}

// ---------------- ROOMS ----------------
function initRooms() {
    const sidebar = document.getElementById('rooms-sidebar');
    sidebar.innerHTML = '';

    for(let i = 1; i <= 15; i++) {
        if(!db[i]) db[i] = { confirmed: [], temp: [], status: 'free' };

        let b = document.createElement('button');
        b.className = `r-btn ${db[i].status === 'busy' ? 'busy' : ''} ${selectedRoom === i ? 'active' : ''}`;
        b.innerText = i;

        b.onclick = () => selectRoom(i);
        sidebar.appendChild(b);
    }
}

function selectRoom(id) {
    selectedRoom = id;
    initRooms();
    renderMenu();
    updateSum();
}

// ---------------- MENU ----------------
function renderMenu() {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    menu.forEach(f => {
        let item = db[selectedRoom].temp.find(i => i.id === f.id);
        let qty = item ? item.qty : 0;

        grid.innerHTML += `
            <div class="food-card">
                ${f.isRoom
                    ? `<div class="room-placeholder">XONALAR</div>`
                    : `<img src="${f.img}" class="food-img">`
                }

                <div class="food-info">
                    <h3>${f.name}</h3>
                    <div class="price-tag">${f.price.toLocaleString()} so'm</div>

                    <div class="qty-box">
                        <button class="qty-btn" onclick="changeQty(${f.id}, -1)">-</button>
                        <span>${qty}</span>
                        <button class="qty-btn" onclick="changeQty(${f.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });
}

function changeQty(id, delta) {
    let r = db[selectedRoom];
    let itm = r.temp.find(i => i.id === id);

    if(itm) {
        itm.qty += delta;
        if(itm.qty <= 0) {
            r.temp = r.temp.filter(i => i.id !== id);
        }
    } else if(delta > 0) {
        let food = menu.find(m => m.id === id);
        r.temp.push({ ...food, qty: 1 });
    }

    renderMenu();
    updateSum();
}

// ---------------- SUM ----------------
function updateSum() {
    let t = [...db[selectedRoom].temp, ...db[selectedRoom].confirmed]
        .reduce((s, i) => s + (i.price * i.qty), 0);

    document.getElementById('room-sum').innerText = t.toLocaleString() + " so'm";
}

// ---------------- ORDER ----------------
function sendOrder() {
    if(db[selectedRoom].temp.length === 0)
        return alert("Hali hech narsa tanlanmadi!");

    db[selectedRoom].confirmed = [...db[selectedRoom].confirmed, ...db[selectedRoom].temp];
    db[selectedRoom].temp = [];
    db[selectedRoom].status = 'busy';

    saveAll();
    selectRoom(selectedRoom);
}

// ---------------- CASHIER ----------------
function renderCashier() {
    const list = document.getElementById('active-bills-list');
    list.innerHTML = '';

    let totalKirim = 0;

    for(let id in db) {
        if(db[id].status === 'busy') {

            let roomTotal = db[id].confirmed
                .reduce((s, i) => s + (i.price * i.qty), 0);

            totalKirim += roomTotal;

            list.innerHTML += `
                <div class="bill-card">
                    <h3>Xona #${id}</h3>

                    ${db[id].confirmed.map((item, idx) => `
                        <div class="edit-item">
                            <span>${item.name}</span>

                            <div>
                                <input type="number" value="${item.qty}"
                                    onchange="updateItem(${id}, ${idx}, 'qty', this.value)">

                                <input type="number" value="${item.price}"
                                    onchange="updateItem(${id}, ${idx}, 'price', this.value)">

                                <button onclick="removeItem(${id}, ${idx})">×</button>
                            </div>
                        </div>
                    `).join('')}

                    <div>
                        <b>JAMI: ${roomTotal.toLocaleString()} so'm</b>
                        <button onclick="payBill(${id})">TO'LOV</button>
                    </div>
                </div>
            `;
        }
    }

    document.getElementById('daily-total').innerText = totalKirim.toLocaleString();
}

function updateItem(room, idx, field, val) {
    db[room].confirmed[idx][field] = parseInt(val) || 0;
    saveAll();
    renderCashier();
}

function removeItem(room, idx) {
    db[room].confirmed.splice(idx, 1);
    if(db[room].confirmed.length === 0)
        db[room].status = 'free';

    saveAll();
    renderCashier();
}

function payBill(id) {
    let total = db[id].confirmed.reduce((s, i) => s + (i.price * i.qty), 0);

    journal.push({
        date: new Date().toLocaleString(),
        room: id,
        total: total
    });

    db[id] = { confirmed: [], temp: [], status: 'free' };

    saveAll();
    renderCashier();
    initRooms();
}

// ---------------- SAVE ----------------
function saveAll() {
    localStorage.setItem('milliy_db_v2', JSON.stringify(db));
    localStorage.setItem('milliy_journal_v2', JSON.stringify(journal));
}