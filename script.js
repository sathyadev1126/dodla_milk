const app = {
    data: { customers: [], transactions: [] },

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadData();
        this.updateDateDisplay();
        this.renderAll();
    },

    cacheDOM() {
        this.ui = {
            navItems: document.querySelectorAll('.nav-item'),
            views: document.querySelectorAll('.view-section'),
            overlay: document.getElementById('modal-overlay'),
            modalCustomer: document.getElementById('modal-customer'),
            modalEntry: document.getElementById('modal-entry'),
            txDate: document.getElementById('tx-date'),
            search: document.getElementById('customer-search')
        };
    },

    bindEvents() {
        this.ui.search.addEventListener('input', () => this.renderAll());
        
        this.ui.navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                this.ui.views.forEach(v => v.classList.add('hidden'));
                document.getElementById(target).classList.remove('hidden');
                this.ui.navItems.forEach(nav => nav.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        document.getElementById('btn-add-customer-main').addEventListener('click', () => {
            document.getElementById('modal-cust-title').textContent = "Add Customer";
            document.getElementById('edit-cust-id').value = "";
            document.getElementById('balance-input-group').style.display = "block";
            this.openModal(this.ui.modalCustomer);
        });

        document.querySelectorAll('.btn-close').forEach(b => b.addEventListener('click', () => this.closeAllModals()));
        this.ui.overlay.addEventListener('click', () => this.closeAllModals());

        document.getElementById('form-customer').addEventListener('submit', (e) => this.handleCustomerSubmit(e));
        document.getElementById('form-entry').addEventListener('submit', (e) => this.handleEntrySubmit(e));
        document.getElementById('btn-export').addEventListener('click', () => this.exportCSV());

        // Close dropdowns on click outside
        window.addEventListener('click', (e) => {
            if (!e.target.matches('.bx-dots-vertical-rounded')) {
                document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
            }
        });
    },

    loadData() {
        const stored = localStorage.getItem('dodlaDues_v3');
        if (stored) this.data = JSON.parse(stored);
    },

    saveAndRefresh() {
        localStorage.setItem('dodlaDues_v3', JSON.stringify(this.data));
        this.renderAll();
    },

    // --- Customer Actions ---
    handleCustomerSubmit(e) {
        e.preventDefault();
        const editId = document.getElementById('edit-cust-id').value;
        const name = document.getElementById('cust-name').value;
        const phone = document.getElementById('cust-phone').value;

        if (editId) {
            const cust = this.data.customers.find(c => c.id === editId);
            cust.name = name; cust.phone = phone;
        } else {
            this.data.customers.push({
                id: 'c' + Date.now(), name, phone,
                balance: parseFloat(document.getElementById('cust-balance').value) || 0
            });
        }
        this.saveAndRefresh();
        this.closeAllModals();
        e.target.reset();
    },

    openEntryModal(custId, type) {
        const cust = this.data.customers.find(c => c.id === custId);
        document.getElementById('tx-cust-id').value = custId;
        document.getElementById('tx-cust-name').value = cust.name;
        document.getElementById('tx-type').value = type;
        document.getElementById('entry-action-type').textContent = type === 'delivery' ? 'Add Due' : 'Receive';
        document.getElementById('btn-entry-submit').className = type === 'delivery' ? 'btn btn-primary w-100 btn-due' : 'btn btn-primary w-100 btn-pay';
        this.ui.txDate.valueAsDate = new Date();
        this.openModal(this.ui.modalEntry);
    },

    handleEntrySubmit(e) {
        e.preventDefault();
        const custId = document.getElementById('tx-cust-id').value;
        const type = document.getElementById('tx-type').value;
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const customer = this.data.customers.find(c => c.id === custId);

        if (customer) {
            customer.balance += (type === 'delivery' ? amount : -amount);
            this.data.transactions.unshift({
                id: 'tx' + Date.now(),
                custId, customerName: customer.name,
                type, amount, date: document.getElementById('tx-date').value
            });
            this.saveAndRefresh();
            this.closeAllModals();
            e.target.reset();
        }
    },

    // --- UI Rendering ---
    toggleDropdown(id) {
        const el = document.getElementById('drop-' + id);
        document.querySelectorAll('.dropdown-menu').forEach(d => { if(d !== el) d.classList.remove('show'); });
        el.classList.toggle('show');
    },

    renderAll() {
        const search = this.ui.search.value.toLowerCase();
        const filtered = this.data.customers.filter(c => c.name.toLowerCase().includes(search));

        const total = this.data.customers.reduce((sum, c) => sum + c.balance, 0);
        document.getElementById('dash-total-dues').textContent = `₹${total.toFixed(2)}`;
        document.getElementById('dash-active-customers').textContent = this.data.customers.length;

        document.getElementById('dash-customers-body').innerHTML = filtered.map(c => `
            <tr>
                <td>
                    <div class="cust-info-cell">
                        <strong>${c.name}</strong>
                        <span>${c.phone}</span>
                    </div>
                </td>
                <td class="amount-dues">₹${c.balance.toFixed(2)}</td>
                <td class="text-right">
                    <button class="btn btn-sm btn-due" onclick="app.openEntryModal('${c.id}', 'delivery')">Due (+)</button>
                    <button class="btn btn-sm btn-pay" onclick="app.openEntryModal('${c.id}', 'payment')">Pay (-)</button>
                </td>
                <td>
                    <div class="dropdown">
                        <i class='bx bx-dots-vertical-rounded' onclick="app.toggleDropdown('${c.id}')"></i>
                        <div class="dropdown-menu" id="drop-${c.id}">
                            <a href="#" onclick="app.editCustomer('${c.id}')"><i class='bx bx-edit'></i> Edit</a>
                            <a href="#" class="del-opt" onclick="app.deleteCustomer('${c.id}')"><i class='bx bx-trash'></i> Delete</a>
                        </div>
                    </div>
                </td>
            </tr>
        `).join('');

        document.getElementById('transactions-table-body').innerHTML = this.data.transactions.map(tx => `
            <tr>
                <td>${tx.date}</td>
                <td>${tx.customerName}</td>
                <td><span class="badge ${tx.type}">${tx.type === 'delivery' ? 'Due' : 'Paid'}</span></td>
                <td class="${tx.type === 'delivery' ? 'amount-dues' : 'amount-credit'}">₹${tx.amount}</td>
                <td><button class="btn-icon delete" onclick="app.deleteTransaction('${tx.id}')"><i class='bx bx-trash'></i></button></td>
            </tr>
        `).join('');
    },

    editCustomer(id) {
        const cust = this.data.customers.find(c => c.id === id);
        document.getElementById('modal-cust-title').textContent = "Edit Details";
        document.getElementById('edit-cust-id').value = cust.id;
        document.getElementById('cust-name').value = cust.name;
        document.getElementById('cust-phone').value = cust.phone;
        document.getElementById('balance-input-group').style.display = "none";
        this.openModal(this.ui.modalCustomer);
    },

    deleteCustomer(id) {
        if(confirm("Permanently delete this customer?")) {
            this.data.customers = this.data.customers.filter(c => c.id !== id);
            this.data.transactions = this.data.transactions.filter(t => t.custId !== id);
            this.saveAndRefresh();
        }
    },

    deleteTransaction(txId) {
        if(confirm("Reverse this entry?")) {
            const tx = this.data.transactions.find(t => t.id === txId);
            const customer = this.data.customers.find(c => c.id === tx.custId);
            if(customer) customer.balance -= (tx.type === 'delivery' ? tx.amount : -tx.amount);
            this.data.transactions = this.data.transactions.filter(t => t.id !== txId);
            this.saveAndRefresh();
        }
    },

    openModal(m) { this.ui.overlay.classList.remove('hidden'); m.classList.remove('hidden'); },
    closeAllModals() { this.ui.overlay.classList.add('hidden'); this.ui.modalCustomer.classList.add('hidden'); this.ui.modalEntry.classList.add('hidden'); },
    updateDateDisplay() { document.getElementById('current-date-display').textContent = new Date().toDateString(); },
    exportCSV() {
        let csv = "Customer,Phone,Balance\n" + this.data.customers.map(c => `${c.name},${c.phone},${c.balance}`).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'Dodla_Milk_Dues.csv'; a.click();
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());
