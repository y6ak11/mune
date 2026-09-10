const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s),money=n=>new Intl.NumberFormat('ar-IQ').format(Math.round(n))+' د.ع';

// ===== الحالة =====
const QAHWA=0.02,HALEEB=0.15,HALEEB2=0.12,KOOB=1; // القهوة: ٢٠ غرام (٠.٠٢ كغم) لكل كوب
let products=[
  ['لاتيه عراقي',4500,'إسبريسو وحليب مخملي','☕','قهوة',[{stock:'حبوب القهوة',qty:QAHWA},{stock:'حليب كامل الدسم',qty:HALEEB},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['كابتشينو',4500,'رغوة خفيفة وطعم قوي','☕','قهوة',[{stock:'حبوب القهوة',qty:QAHWA},{stock:'حليب كامل الدسم',qty:HALEEB2},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['أمريكانو',3500,'قهوة سوداء مضبوطة','☕','قهوة',[{stock:'حبوب القهوة',qty:QAHWA},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['موكا بارد',5500,'شوكولاتة وكريمة','🥤','بارد',[{stock:'حبوب القهوة',qty:QAHWA},{stock:'حليب كامل الدسم',qty:HALEEB},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['سبانيش لاتيه',5500,'حليب محلى وكراميل','☕','قهوة',[{stock:'حبوب القهوة',qty:QAHWA},{stock:'حليب كامل الدسم',qty:HALEEB},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['ماتشا',6000,'ماتشا ياباني وحليب','🍵','بارد',[{stock:'حليب كامل الدسم',qty:HALEEB},{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['كرواسون زبدة',3000,'مخبوز اليوم','🥐','حلويات',[{stock:'كرواسون',qty:1}]],
  ['كيكة تمر',4000,'تمر وهيل وصوص','🍰','حلويات',[]],
  ['ساندويش حلوم',6500,'حلوم مشوي وخضرة','🥪','فطور',[]],
  ['توست أفوكادو',7000,'أفوكادو وبيض','🍞','فطور',[]],
  ['ليمون نعناع',3000,'بارد ومنعش','🍋','بارد',[{stock:'أكواب حجم كبير',qty:KOOB}]],
  ['ماء',1000,'قنينة 330 مل','💧','بارد',[]],
].map((x,i)=>({id:i+1,name:x[0],price:x[1],desc:x[2],icon:x[3],category:x[4],recipe:x[5]}));

let cart=[];
let orders=JSON.parse(localStorage.getItem('hillaOrders')||'[]');
let customers=JSON.parse(localStorage.getItem('hillaCustomers')||'[{"name":"زينب علي","phone":"٠٧٧٠ ١٢٣ ٤٥٦٧","points":120},{"name":"علي كريم","phone":"٠٧٨١ ٤٥٦ ٨٨٩٩","points":75}]');
let stock=JSON.parse(localStorage.getItem('hillaStock')||'[{"name":"حبوب القهوة","qty":2,"unit":"كغم","min":3},{"name":"حليب كامل الدسم","qty":8,"unit":"لتر","min":5},{"name":"أكواب حجم كبير","qty":22,"unit":"كوب","min":30},{"name":"كرواسون","qty":14,"unit":"قطعة","min":12}]');
let shiftHistory=JSON.parse(localStorage.getItem('hillaShiftHistory')||'[]');
let currentCustomer=null,category='الكل',orderNum=1048;

// ===== أدوات مساعدة =====
const toast=t=>{$('#toast').textContent=t;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),2200)};
const save=()=>{localStorage.setItem('hillaOrders',JSON.stringify(orders));localStorage.setItem('hillaCustomers',JSON.stringify(customers))};
const saveStock=()=>{localStorage.setItem('hillaStock',JSON.stringify(stock));updateStockBadge()};

// كل صنف عنده "recipe" خاص فيه (مادة المخزون + الكمية المستهلكة بالقطعة الواحدة)
// يتحط وقت تضيف أو تعدل الصنف من صفحة المنيو، وينخصم تلقائياً وقت يتباع
function deductStock(items){
  let touched=false;
  items.forEach(it=>{
    let recipe=it.recipe;
    if(!recipe||!recipe.length)return;
    recipe.forEach(r=>{
      let s=stock.find(x=>x.name===r.stock);
      if(s){s.qty=Math.max(0,+(s.qty-r.qty*it.qty).toFixed(2));touched=true}
    });
  });
  if(touched)saveStock();
}
function updateStockBadge(){
  let b=$('#stockBadge');
  if(!b)return;
  let low=stock.filter(s=>s.qty<=s.min).length;
  if(low>0){b.textContent=low;b.classList.add('alert');b.style.display='inline-block'}
  else{b.style.display='none'}
}
const saveShiftHistory=()=>localStorage.setItem('hillaShiftHistory',JSON.stringify(shiftHistory));
const modal=h=>{$('#modalBody').innerHTML=h;$('#modal').showModal()};

// ===== الكاشير =====
function renderProducts(){
  let q=$('#search').value;
  let list=products.filter(p=>(category==='الكل'||p.category===category)&&p.name.includes(q));
  $('#products').innerHTML=list.map(p=>`<button class="product" data-id="${p.id}"><div class="food">${p.icon}</div><div class="product-content"><b>${p.name}</b><small>${p.desc}</small><span class="price">${money(p.price)}</span></div><span class="plus">+</span></button>`).join('')||'<p class="empty">ما لكينا شي بهالاسم</p>';
  $('#itemCount').textContent=`${list.length} صنف`;
  $$('.product').forEach(b=>b.onclick=()=>addCart(+b.dataset.id));
}
function renderCategories(){
  let cats=['الكل',...new Set(products.map(p=>p.category))];
  $('#categories').innerHTML=cats.map(c=>`<button class="chip ${c===category?'active':''}" data-c="${c}">${c}</button>`).join('');
  $$('.chip').forEach(b=>b.onclick=()=>{category=b.dataset.c;renderCategories();renderProducts()});
}
function addCart(id){
  let p=products.find(p=>p.id===id),x=cart.find(x=>x.id===id);
  x?x.qty++:cart.push({...p,qty:1});
  renderCart();
  toast(`انضاف ${p.name} للسلة`);
}
function renderCart(){
  let sub=cart.reduce((s,p)=>s+p.price*p.qty,0),rate=+$('#serviceRate').value||5,tax=sub*rate/100,total=sub+tax;
  $('#cartItems').innerHTML=cart.length?cart.map(p=>`<article class="cart-item"><div class="tiny-food">${p.icon}</div><div><b>${p.name}</b><small>${money(p.price)} للواحد</small><div class="quantity"><button data-change="-1" data-id="${p.id}">−</button><span>${p.qty}</span><button data-change="1" data-id="${p.id}">+</button><strong class="line-total">${money(p.price*p.qty)}</strong></div></div></article>`).join(''):'<p class="empty">السلة فارغة، اختار شي من المنيو</p>';
  $('#subtotal').textContent=money(sub);
  $('#tax').textContent=money(tax);
  $('#total').textContent=money(total);
  $('#payAmount').textContent=cart.length?money(total):'';
  $('#pay').disabled=!cart.length;
  $$('[data-change]').forEach(b=>b.onclick=()=>{let x=cart.find(x=>x.id==b.dataset.id);x.qty+=+b.dataset.change;if(x.qty<1)cart=cart.filter(y=>y!==x);renderCart()});
}
function updateCustomer(){
  $('#customerInitial').textContent=currentCustomer?currentCustomer.name[0]:'+';
  $('#customerName').textContent=currentCustomer?.name||'إضافة زبون';
  $('#customerInfo').textContent=currentCustomer?`${currentCustomer.points} نقطة جاهزة إلك`:'حتى نحفظ نقاطه';
}

// ===== التنقل بين الصفحات =====
function showPage(id){
  $$('.page').forEach(p=>p.classList.remove('shown'));
  $('#'+id).classList.add('shown');
  $$('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===id));
  $('#pageTitle').textContent={pos:'يلا ناخذ طلب جديد',orders:'طلبات اليوم',menu:'منيو المقهى',customers:'زبائنّا',barista:'شاشة الباريستا',inventory:'المخزون والتنبيهات',shifts:'إدارة الشفتات',reports:'أرقام الشفت',settings:'إعدادات المقهى'}[id];
  if(id==='orders')renderOrders();
  if(id==='menu')renderManage();
  if(id==='customers')renderCustomers();
  if(id==='barista')renderKitchen();
  if(id==='inventory')renderStock();
  if(id==='shifts')renderShiftPage();
  if(id==='reports')renderReports();
  $('.side').classList.remove('open');
}

// ===== الطلبات =====
function renderOrders(){
  let list=[...orders].reverse();
  $('#ordersList').innerHTML=list.length?list.map(o=>`<article class="order-row"><div><b>${o.no} · ${o.customer||'ضيف'}</b><small>${o.items.map(x=>x.name+' ×'+x.qty).join('، ')}</small></div><b>${money(o.total)}</b><span class="status">مدفوع · ${o.method}</span></article>`).join(''):'<p class="empty">بعد ماكو طلبات مسددة اليوم</p>';
  $('#orderBadge').textContent=orders.length;
}

// ===== إدارة المنيو (تعديل + حذف) =====
function renderManage(){
  $('#menuManage').innerHTML=products.map(p=>{
    let link=p.recipe&&p.recipe[0]?` · 🔗 ${p.recipe[0].qty} ${stock.find(s=>s.name===p.recipe[0].stock)?.unit||''} ${p.recipe[0].stock}`:'';
    return `<article class="manage-row"><span class="tiny-food">${p.icon}</span><div><b>${p.name}</b><small>${p.category} · ${money(p.price)}${link}</small></div><div class="row-actions"><button data-edit="${p.id}">تعديل</button><button data-delete="${p.id}" class="danger">حذف</button></div></article>`;
  }).join('');
  $$('[data-edit]').forEach(b=>b.onclick=()=>editProduct(+b.dataset.edit));
  $$('[data-delete]').forEach(b=>b.onclick=()=>confirmDeleteProduct(+b.dataset.delete));
}
function editProduct(id){
  let p=products.find(x=>x.id===id),cur=p.recipe&&p.recipe[0];
  modal(`<h2 class="modal-title">تعديل ${p.name}</h2><label class="modal-field">السعر بالدينار<input id="newPrice" type="number" value="${p.price}"></label><label class="modal-field">مرتبط بمادة من المخزون (اختياري)<select id="editStock"><option value="">بدون ربط</option>${stock.map(s=>`<option value="${s.name}" ${cur&&cur.stock===s.name?'selected':''}>${s.name} (${s.unit})</option>`).join('')}</select></label><label class="modal-field">الكمية المستهلكة لكل قطعة تنباع<input id="editStockQty" type="number" step="0.01" value="${cur?cur.qty:''}" placeholder="مثلاً 0.02 لو الوحدة كغم"></label><div class="modal-actions"><button class="primary" id="savePrice" type="button">حفظ</button><button class="outline" value="cancel">رجوع</button></div>`);
  $('#savePrice').onclick=()=>{
    p.price=+$('#newPrice').value;
    let sn=$('#editStock').value,sq=+$('#editStockQty').value;
    p.recipe=(sn&&sq>0)?[{stock:sn,qty:sq}]:[];
    $('#modal').close();renderProducts();renderManage();toast('تم تحديث الصنف');
  };
}
function confirmDeleteProduct(id){
  let p=products.find(x=>x.id===id);
  if(!p)return;
  modal(`<h2 class="modal-title">حذف ${p.name}؟</h2><p class="modal-note">هذا الإجراء يشيل الصنف نهائياً من المنيو ومن صفحة الكاشير.</p><div class="modal-actions"><button class="primary danger-solid" id="confirmDelete" type="button">حذف نهائي</button><button class="outline" value="cancel">رجوع</button></div>`);
  $('#confirmDelete').onclick=()=>{
    products=products.filter(x=>x.id!==id);
    cart=cart.filter(x=>x.id!==id);
    $('#modal').close();
    renderCategories();renderProducts();renderManage();renderCart();
    toast('تم حذف الصنف من المنيو');
  };
}

// ===== الزبائن (اختيار + حذف) =====
function renderCustomers(){
  $('#customersList').innerHTML=customers.map((c,i)=>`<article class="manage-row"><span class="avatar">${c.name[0]}</span><div><b>${c.name}</b><small>${c.phone} · ${c.points} نقطة</small></div><div class="row-actions"><button data-select="${i}">اختيار</button><button data-delc="${i}" class="danger">حذف</button></div></article>`).join('');
  $$('[data-select]').forEach(b=>b.onclick=()=>{currentCustomer=customers[+b.dataset.select];updateCustomer();showPage('pos');toast('تم اختيار الزبون')});
  $$('[data-delc]').forEach(b=>b.onclick=()=>confirmDeleteCustomer(+b.dataset.delc));
}
function confirmDeleteCustomer(i){
  let c=customers[i];
  if(!c)return;
  modal(`<h2 class="modal-title">حذف ${c.name}؟</h2><p class="modal-note">راح تنشال بياناته ونقاطه نهائياً من قائمة الزبائن.</p><div class="modal-actions"><button class="primary danger-solid" id="confirmDelCustomer" type="button">حذف نهائي</button><button class="outline" value="cancel">رجوع</button></div>`);
  $('#confirmDelCustomer').onclick=()=>{
    if(currentCustomer===c){currentCustomer=null;updateCustomer()}
    customers=customers.filter((x,idx)=>idx!==i);
    save();
    $('#modal').close();
    renderCustomers();
    toast('تم حذف الزبون');
  };
}

// ===== التقارير =====
function renderReports(){
  let sales=orders.reduce((s,o)=>s+o.total,0);
  $('#salesStat').textContent=money(sales);
  $('#ordersStat').textContent=orders.length;
  $('#avgStat').textContent=money(orders.length?sales/orders.length:0);
  $('#chart').innerHTML=[34,62,44,88,72,100,57,43].map((v,i)=>`<div class="bar" style="height:${v}%"><small>${8+i}:٠٠</small></div>`).join('');
  renderTopItems();
}
// فكرة جديدة: لوحة "الأصناف الأكثر مبيعاً" — تحسب الأصناف من طلبات الشفت الحالي وترتبها
function renderTopItems(){
  let counts={};
  orders.forEach(o=>o.items.forEach(it=>{
    counts[it.name]=counts[it.name]||{qty:0,revenue:0};
    counts[it.name].qty+=it.qty;
    counts[it.name].revenue+=it.price*it.qty;
  }));
  let list=Object.entries(counts).sort((a,b)=>b[1].qty-a[1].qty).slice(0,5);
  $('#topItems').innerHTML=list.length?list.map(([name,d],i)=>`<article class="top-item"><span class="rank ${i===0?'gold':''}">${i+1}</span><div><b>${name}</b><small>${money(d.revenue)} إجمالي</small></div><span class="qty">${d.qty}×</span></article>`).join(''):'<p class="empty">بعد ماكو مبيعات هذا الشفت</p>';
}

// ===== شاشة الباريستا =====
function renderKitchen(){
  let list=[...orders].reverse().slice(0,9);
  $('#kitchenBoard').innerHTML=list.length?list.map((o)=>`<article class="kitchen-ticket ${o.ready?'ready':''}"><small>${o.no} · ${o.method}</small><h3>${o.customer||'طلب ضيف'}</h3><p>${o.items.map(x=>x.name+' ×'+x.qty).join(' · ')}</p><button data-ticket="${orders.indexOf(o)}">${o.ready?'تم التسليم ✓':'جاهز للاستلام'}</button></article>`).join(''):'<p class="empty">ماكو طلبات مدفوعة بعد</p>';
  $$('[data-ticket]').forEach(b=>b.onclick=()=>{orders[+b.dataset.ticket].ready=true;save();renderKitchen();toast('تم تسليم الطلب')});
}

// ===== المخزون =====
function renderStock(){
  $('#stockList').innerHTML=stock.map((s,i)=>`<article class="manage-row ${s.qty<=s.min?'low-stock':''}"><span class="tiny-food">▧</span><div><b>${s.name}</b><small>${s.qty} ${s.unit} متوفر ${s.qty<=s.min?'· يحتاج طلب':''}</small></div><button data-stock="${i}">تحديث الكمية</button></article>`).join('');
  $$('[data-stock]').forEach(b=>b.onclick=()=>{
    let i=+b.dataset.stock,s=stock[i];
    modal(`<h2 class="modal-title">${s.name}</h2><label class="modal-field">الكمية الحالية<input id="stockQty" type="number" value="${s.qty}"></label><div class="modal-actions"><button class="primary" id="saveStock" type="button">حفظ</button></div>`);
    $('#saveStock').onclick=()=>{s.qty=+$('#stockQty').value;saveStock();$('#modal').close();renderStock();toast('تم تحديث المخزون')};
  });
}

// ===== الشفتات: مطابقة الكاش + الإغلاق + السجل =====
function renderShiftPage(){
  let cashSales=orders.filter(o=>o.method==='كاش').reduce((s,o)=>s+o.total,0);
  $('#cashStat').textContent=money(cashSales);
  $('#shiftOrdersStat').textContent=orders.length;
  renderShiftHistory();
}
function renderShiftHistory(){
  let list=[...shiftHistory].reverse();
  $('#shiftHistoryList').innerHTML=list.length?list.map(h=>{
    let d=new Date(h.date),dateStr=d.toLocaleDateString('ar-IQ',{day:'numeric',month:'long'})+' · '+d.toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'});
    let cls=h.diff===0?'ok':h.diff<0?'bad':'good';
    let diffTxt=h.diff===0?'مطابق':h.diff<0?'نقص '+money(Math.abs(h.diff)):'زيادة '+money(h.diff);
    return `<article class="order-row"><div><b>${dateStr}</b><small>${h.orders} طلب · مبيعات ${money(h.sales)}</small></div><b>${money(h.cashActual)}</b><span class="status ${cls}">${diffTxt}</span></article>`;
  }).join(''):'<p class="empty">ماكو شفتات مسكرة بعد</p>';
}
function openCloseShiftModal(){
  let cashSales=orders.filter(o=>o.method==='كاش').reduce((s,o)=>s+o.total,0);
  let totalSales=orders.reduce((s,o)=>s+o.total,0);
  modal(`<h2 class="modal-title">إغلاق الشفت</h2><p class="shift-summary-line">الكاش المفروض بالصندوق حسب النظام: <b>${money(cashSales)}</b></p><label class="modal-field">الكاش الموجود عندك فعلياً بالصندوق<input id="actualCash" type="number" placeholder="اكتب المبلغ بالدينار" autofocus></label><p id="cashDiff" class="cash-diff"></p><div class="modal-actions"><button class="primary" id="printCloseShift" type="button">طبع وإغلاق الشفت</button></div>`);
  $('#actualCash').oninput=()=>{
    let raw=$('#actualCash').value,diffEl=$('#cashDiff');
    if(!raw){diffEl.textContent='';diffEl.className='cash-diff';return}
    let actual=+raw,diff=actual-cashSales;
    if(diff===0){diffEl.textContent='مطابق تماماً، ما أكو فرق 👍';diffEl.className='cash-diff ok'}
    else if(diff<0){diffEl.textContent='أكو نقص بالصندوق: '+money(Math.abs(diff));diffEl.className='cash-diff bad'}
    else{diffEl.textContent='أكو زيادة بالصندوق: '+money(diff);diffEl.className='cash-diff good'}
  };
  $('#printCloseShift').onclick=()=>{
    if(!$('#actualCash').value)return toast('اكتب المبلغ الموجود بالصندوق اول');
    let actual=+$('#actualCash').value,diff=actual-cashSales,cafeName=document.querySelector('.brand span').textContent;
    let diffLine=diff===0?'الحساب مطابق تماماً، ما أكو نقص ولا زيادة ✓':diff<0?`أكو نقص بالصندوق قدره ${money(Math.abs(diff))}`:`أكو زيادة بالصندوق قدرها ${money(diff)}`;
    $('#modalBody').innerHTML=`<div class="print-report" id="printArea"><h2 class="modal-title">تقرير إغلاق الشفت</h2><p>${cafeName} · ${new Date().toLocaleString('ar-IQ')}</p><p>عدد الطلبات: <b>${orders.length}</b></p><p>إجمالي المبيعات (كل طرق الدفع): <b>${money(totalSales)}</b></p><p>مبيعات الكاش حسب النظام: <b>${money(cashSales)}</b></p><p>الكاش الفعلي المعدود بالصندوق: <b>${money(actual)}</b></p><p class="diff-line ${diff===0?'ok':diff<0?'bad':'good'}">${diffLine}</p><div class="modal-actions"><button class="primary" id="doPrintShift" type="button">طباعة الآن</button></div></div>`;
    $('#doPrintShift').onclick=()=>{
      window.print();
      shiftHistory.push({date:new Date().toISOString(),orders:orders.length,sales:totalSales,cashExpected:cashSales,cashActual:actual,diff});
      saveShiftHistory();
      orders=[];
      save();
      renderOrders();
      renderShiftPage();
      $('#modal').close();
      toast(diff===0?'تم إغلاق الشفت والحساب مطابق تماماً':diff<0?'تم إغلاق الشفت — فيه نقص '+money(Math.abs(diff)):'تم إغلاق الشفت — فيه زيادة '+money(diff));
    };
  };
}

// ===== الدفع =====
function completeOrder(method){
  let sub=cart.reduce((s,p)=>s+p.price*p.qty,0),total=sub*(1+(+$('#serviceRate').value||5)/100);
  orders.push({no:'#'+orderNum,customer:currentCustomer?.name,items:cart,total,method});
  if(currentCustomer)currentCustomer.points+=Math.floor(total/1000);
  deductStock(cart);
  save();
  $('#modal').close();
  cart=[];
  orderNum++;
  $('#orderNo').textContent='#'+orderNum;
  renderCart();
  updateCustomer();
  toast('تم الدفع، صحة وعافية!');
}

// ===== ربط الأحداث =====
$('#search').oninput=renderProducts;
$$('.nav').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
$('#menuToggle').onclick=()=>$('.side').classList.toggle('open');
$('#theme').onclick=()=>document.body.classList.toggle('dark');
$('#clearCart').onclick=()=>{cart=[];renderCart();toast('تم تفريغ السلة')};
$('#newOrder').onclick=()=>{cart=[];currentCustomer=null;orderNum++;$('#orderNo').textContent='#'+orderNum;updateCustomer();renderCart();showPage('pos');toast('طلب جديد جاهز')};
$('#customerBtn').onclick=()=>showPage('customers');

$('#addCustom').onclick=()=>{
  modal(`<h2 class="modal-title">صنف مفتوح</h2><label class="modal-field">الاسم<input id="customName"></label><label class="modal-field">السعر<input id="customPrice" type="number"></label><div class="modal-actions"><button class="primary" id="saveCustom" type="button">إضافة للسلة</button></div>`);
  $('#saveCustom').onclick=()=>{let n=$('#customName').value,p=+$('#customPrice').value;if(!n||!p)return toast('اكتب الاسم والسعر');cart.push({id:Date.now(),name:n,price:p,qty:1,icon:'✦'});$('#modal').close();renderCart()};
};

$('#pay').onclick=()=>{
  modal(`<h2 class="modal-title">شلون راح يدفع؟</h2><div class="payment-options"><button data-method="كاش">كاش<br><small>دينار عراقي</small></button><button data-method="كي كارد">كي كارد<br><small>بطاقة محلية</small></button><button data-method="فيزا">فيزا / ماستر<br><small>بطاقات</small></button><button data-method="آسياسيل كاش">آسياسيل كاش<br><small>محفظة</small></button></div>`);
  $$('[data-method]').forEach(b=>b.onclick=()=>completeOrder(b.dataset.method));
};

$('#addCustomer').onclick=()=>{
  modal(`<h2 class="modal-title">إضافة زبون</h2><label class="modal-field">الاسم<input id="cName"></label><label class="modal-field">الموبايل<input id="cPhone"></label><div class="modal-actions"><button class="primary" id="saveCustomer" type="button">حفظ</button></div>`);
  $('#saveCustomer').onclick=()=>{let n=$('#cName').value,p=$('#cPhone').value;if(!n||!p)return toast('أدخل الاسم ورقم الموبايل');customers.push({name:n,phone:p,points:0});save();$('#modal').close();renderCustomers();toast('انضاف الزبون')};
};

$('#addMenuItem').onclick=()=>{
  modal(`<h2 class="modal-title">صنف جديد</h2><label class="modal-field">الاسم<input id="mName"></label><label class="modal-field">السعر<input id="mPrice" type="number"></label><label class="modal-field">القسم<select id="mCat"><option>قهوة</option><option>بارد</option><option>فطور</option><option>حلويات</option></select></label><label class="modal-field">مرتبط بمادة من المخزون (اختياري)<select id="mStock"><option value="">بدون ربط</option>${stock.map(s=>`<option value="${s.name}">${s.name} (${s.unit})</option>`).join('')}</select></label><label class="modal-field">الكمية المستهلكة لكل قطعة تنباع<input id="mStockQty" type="number" step="0.01" placeholder="مثلاً 0.02 لو الوحدة كغم"></label><div class="modal-actions"><button class="primary" id="saveMenu" type="button">إضافة</button></div>`);
  $('#saveMenu').onclick=()=>{
    let n=$('#mName').value,p=+$('#mPrice').value;
    if(!n||!p)return toast('اكتب الاسم والسعر');
    let sn=$('#mStock').value,sq=+$('#mStockQty').value,recipe=(sn&&sq>0)?[{stock:sn,qty:sq}]:[];
    products.push({id:Date.now(),name:n,price:p,category:$('#mCat').value,desc:'صنف جديد',icon:'☕',recipe});
    $('#modal').close();renderCategories();renderProducts();renderManage();
    toast('انضاف الصنف للمنيو'+(recipe.length?' ومرتبط بالمخزون تلقائياً':''));
  };
};

$('#exportOrders').onclick=()=>{
  let data='رقم الطلب,الزبون,المبلغ,الدفع\n'+orders.map(o=>`${o.no},${o.customer||'ضيف'},${o.total},${o.method}`).join('\n'),a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([data],{type:'text/csv;charset=utf-8'}));
  a.download='طلبات-يوسف.csv';
  a.click();
  URL.revokeObjectURL(a.href);
};

$('#saveSettings').onclick=()=>{document.querySelector('.brand span').textContent=$('#cafeName').value;renderCart();toast('تم حفظ الإعدادات')};

$('#closeShift').onclick=openCloseShiftModal;
$('#closeShiftReport').onclick=openCloseShiftModal;

$('#refreshKitchen').onclick=renderKitchen;
$('#addStock').onclick=()=>{
  modal('<h2 class="modal-title">إضافة مادة</h2><label class="modal-field">الاسم<input id="stockName"></label><label class="modal-field">الكمية<input id="stockNewQty" type="number"></label><label class="modal-field">الوحدة<input id="stockUnit" placeholder="كغم / لتر / قطعة"></label><div class="modal-actions"><button class="primary" id="saveNewStock" type="button">إضافة</button></div>');
  $('#saveNewStock').onclick=()=>{let n=$('#stockName').value,q=+$('#stockNewQty').value,u=$('#stockUnit').value;if(!n||!u)return toast('كمّل المعلومات');stock.push({name:n,qty:q,unit:u,min:5});saveStock();$('#modal').close();renderStock();toast('انضافت المادة')};
};

// ===== الساعة والتاريخ =====
function tick(){$('#clock').textContent=new Date().toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'})}
tick();
setInterval(tick,30000);
$('#today').textContent='هلا يوسف، '+new Date().toLocaleDateString('ar-IQ',{weekday:'long',day:'numeric',month:'long'});

// ===== الإقلاع =====
renderCategories();
renderProducts();
renderCart();
renderOrders();
updateStockBadge();
