
let selectedCustomer = null;
let actionType = ""; // bill or pay


/* PAGE SWITCH */
function show(id){

document.querySelectorAll('.page')
.forEach(p=>p.classList.remove('active'));

document.getElementById(id)
.classList.add('active');

renderAll();
}


/* HELPERS */
function today(){
return new Date().toISOString().split("T")[0];
}

function nowDateTime(){
return new Date().toLocaleString();
}


/* STORAGE */
function getCustomers(){
return JSON.parse(localStorage.getItem("customers")||"[]");
}

function saveCustomers(data){
localStorage.setItem("customers",JSON.stringify(data));
}

function getBills(){
return JSON.parse(localStorage.getItem("bills")||"[]");
}

function saveBills(data){
localStorage.setItem("bills",JSON.stringify(data));
}


/* ADD CUSTOMER */
function addCustomer(){

let name=cName.value.trim();
let mob=cMobile.value.trim();

if(!name||!mob){
alert("Fill all fields");
return;
}

let arr=getCustomers();

arr.push({
id:Date.now(),
name:name,
mobile:mob
});

saveCustomers(arr);

cName.value="";
cMobile.value="";

renderAll();

alert("Customer Added");
}


/* DASHBOARD */
function renderDashboard(){

let cust=getCustomers();
let bills=getBills();

dashList.innerHTML="";

let todayDate=new Date();

cust.forEach(c=>{

let total=0,paid=0,lastDueDate=null;

bills
.filter(b=>b.cid===c.id)
.forEach(b=>{

let billVal=Number(b.bill)||0;
let paidVal=Number(b.paid)||0;

total+=billVal;
paid+=paidVal;

let due=billVal-paidVal;

if(due>0 && b.dateOnly){
lastDueDate=new Date(b.dateOnly);
}
});

let due=total-paid;

let pendingDays=0;

if(due>0 && lastDueDate){
let diff=todayDate-lastDueDate;
pendingDays=Math.floor(diff/(1000*60*60*24));
}


dashList.innerHTML+=`

<div class="dash-card">

<div class="dash-header">${c.name}</div>

<div class="dash-mobile">📞 ${c.mobile}</div>

<div class="dash-row">
<span>Bill</span>
<span>₹${total}</span>
</div>

<div class="dash-row">
<span>Paid</span>
<span>₹${paid}</span>
</div>

<div class="dash-row">
<span class="${due>0?'red':''}">Due</span>
<span class="${due>0?'red':''}">₹${due}</span>
</div>

${
due>0
?`<div class="dash-row red">
⏳ ${pendingDays} Days Pending
</div>`
:`<div class="dash-row" style="color:green">
✅ Clear
</div>`
}

<div class="dash-btns">

<button onclick="openBill(${c.id})">+ Bill</button>

<button onclick="openPay(${c.id})">Pay</button>

</div>

</div>
`;
});

}


/* PAYMENT */
function openBill(id){

actionType="bill";
selectedCustomer=id;

let c=getCustomers().find(x=>x.id===id);

payTitle.innerText="Add Bill - "+c.name;

payDate.value=today();

todayBill.style.display="block";
paidAmt.style.display="none";

payBox.style.display="block";
}

function openPay(id){

actionType="pay";
selectedCustomer=id;

let c=getCustomers().find(x=>x.id===id);

payTitle.innerText="Pay - "+c.name;

payDate.value=today();

todayBill.style.display="none";
paidAmt.style.display="block";

payBox.style.display="block";
}

function closePay(){
payBox.style.display="none";
}


/* SAVE */
function saveAction(){

let date=payDate.value;

let bill=Number(todayBill.value)||0;
let paid=Number(paidAmt.value)||0;

if(!date){
alert("Select Date");
return;
}

let arr=getBills();

let found=arr.find(b=>
b.cid===selectedCustomer &&
b.dateOnly===date
);


/* ADD BILL (merge same day) */
if(actionType==="bill"){

if(bill<=0){
alert("Enter bill");
return;
}

if(found){
found.bill+=bill;
found.dateTime=nowDateTime();
}
else{
arr.push({
cid:selectedCustomer,
bill:bill,
paid:0,
dateOnly:date,
dateTime:nowDateTime()
});
}
}


/* PAY (always new row) */
if(actionType==="pay"){

if(paid<=0){
alert("Enter paid");
return;
}

arr.push({
cid:selectedCustomer,
bill:0,
paid:paid,
dateOnly:date,
dateTime:nowDateTime()
});
}

saveBills(arr);

todayBill.value="";
paidAmt.value="";

closePay();

renderAll();

alert("Saved");
}


/* CUSTOMERS */
function renderCustomers(){

let arr=getCustomers();

custList.innerHTML="";

arr.forEach((c,i)=>{

custList.innerHTML+=`

<div class="card">

<input value="${c.name}"
onchange="editName(${i},this.value)">

<input value="${c.mobile}"
onchange="editMobile(${i},this.value)">

<button onclick="delCustomer(${i})">Delete</button>

</div>
`;
});
}

function editName(i,val){
let arr=getCustomers();
arr[i].name=val.trim();
saveCustomers(arr);
renderAll();
}

function editMobile(i,val){
let arr=getCustomers();
arr[i].mobile=val.trim();
saveCustomers(arr);
}

function delCustomer(i){

if(!confirm("Delete?")) return;

let arr=getCustomers();

arr.splice(i,1);

saveCustomers(arr);

renderAll();
}


/* HISTORY */
function renderHistory(){

let cust=getCustomers();

hisSelect.innerHTML="";

if(cust.length===0){
hisList.innerHTML="<p>No Customers</p>";
return;
}

cust.forEach(c=>{
hisSelect.innerHTML+=`
<option value="${c.id}">
${c.name}
</option>`;
});

showHistory();
}

hisSelect.onchange=showHistory;


function showHistory(){

  let id = Number(hisSelect.value);

  let bills = getBills()
    .filter(b => b.cid === id)
    .sort((a,b)=> new Date(a.dateTime) - new Date(b.dateTime));

  hisList.innerHTML = "";

  if(bills.length === 0){
    hisList.innerHTML = "<p>No History</p>";
    return;
  }

  let balance = 0;

  // First calculate balances
  let rows = [];

  bills.forEach(b => {

    let bill = Number(b.bill)||0;
    let paid = Number(b.paid)||0;

    balance = balance + bill - paid;

    rows.push({
      date: b.dateTime || b.dateOnly || "N/A",
      bill: bill,
      paid: paid,
      balance: balance
    });

  });

  // Show newest first
  rows.reverse().forEach(r => {

    hisList.innerHTML += `

      <div class="card">

        <b>Date:</b> ${r.date}<br>

        Bill: ₹${r.bill}<br>
        Paid: ₹${r.paid}<br>

        <span class="${r.balance>0?'red':''}">
          Balance Due: ₹${r.balance}
        </span>

      </div>

    `;
  });

}


/* EXPORT PDF */
function exportHistoryPDF(){

let id=Number(hisSelect.value);

if(!id){
alert("Select Customer");
return;
}

let cust=getCustomers().find(c=>c.id===id);
let bills=getBills().filter(b=>b.cid===id);

if(bills.length===0){
alert("No History");
return;
}

const {jsPDF}=window.jspdf;

let doc=new jsPDF();

let y=20;

doc.setFontSize(16);
doc.text("Payment History",65,12);

doc.setFontSize(12);
doc.text("Customer: "+cust.name,10,20);

y=30;

bills.forEach(b=>{

if(y>260){
doc.addPage();
y=20;
}

let bill=Number(b.bill)||0;
let paid=Number(b.paid)||0;
let due=bill-paid;
let dt=b.dateTime||b.dateOnly||"N/A";

doc.setFontSize(11);

doc.text(`Date: ${dt}`,10,y);
y+=6;

doc.text(`Bill: ₹${bill}`,10,y);
doc.text(`Paid: ₹${paid}`,70,y);
doc.text(`Due: ₹${due}`,130,y);

y+=10;

});

doc.save(cust.name+"_history.pdf");
}


/* RENDER */
function renderAll(){

renderDashboard();
renderCustomers();
renderHistory();
}

/* LOAD */
renderAll();
