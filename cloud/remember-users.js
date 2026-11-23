const rememberedUsersKey='oeste-remembered-users-v1';
function rememberedUsers(){try{const value=JSON.parse(localStorage.getItem(rememberedUsersKey)||'[]');return Array.isArray(value)?value.filter(u=>/^[a-z0-9._-]{3,40}$/.test(u.login)&&typeof u.display==='string').slice(0,30):[];}catch{return [];}}
function rememberAccount(login,display,identity){
 if(!/^[a-z0-9._-]{3,40}$/.test(login||''))return;
 try{const users=rememberedUsers().filter(u=>u.login!==login&&u.identity!==identity);users.unshift({login,display:String(display||login).slice(0,80),identity});localStorage.setItem(rememberedUsersKey,JSON.stringify(users.slice(0,30)));}catch{}
}
function rememberedLogin(){
 const form=document.querySelector('#login-form');if(!form)return;const input=form.elements.name,label=input.closest('label');if(!label)return;
 let box=document.querySelector('#remembered-logins');if(!box){box=document.createElement('div');box.id='remembered-logins';label.before(box);}
 const users=rememberedUsers();box.replaceChildren();label.hidden=false;if(!users.length)return;
 const wrapper=document.createElement('label');wrapper.textContent='Usuario';const select=document.createElement('select');select.name='rememberedLogin';for(const u of users){const option=document.createElement('option');option.value=u.login;option.textContent=u.display;select.append(option);}const other=document.createElement('option');other.value='';other.textContent='Otro usuario';select.append(other);wrapper.append(select);box.append(wrapper);
 const forget=document.createElement('button');forget.type='button';forget.className='ghost';forget.textContent='Olvidar usuario en este navegador';box.append(forget);
 const choose=()=>{label.hidden=!!select.value;if(select.value)input.value=select.value;else input.value='';forget.hidden=!select.value;form.elements.password.value='';};select.value=users.some(u=>u.login===input.value)?input.value:users[0].login;choose();select.addEventListener('change',choose);
 forget.addEventListener('click',()=>{try{localStorage.setItem(rememberedUsersKey,JSON.stringify(rememberedUsers().filter(u=>u.login!==select.value)));}catch{}input.value='';rememberedLogin();});
}
rememberedLogin();
