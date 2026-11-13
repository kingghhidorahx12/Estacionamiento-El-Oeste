'use strict';
// Offline choices are conveniences, never vehicle recognition or business rules.
const vehicleMakes = ['Acura','Audi','BAIC','BMW','Buick','BYD','Cadillac','Changan','Chery','Chevrolet','Chirey','Chrysler','Cupra','Dodge','Fiat','Ford','GMC','Great Wall','Honda','Hyundai','Infiniti','Isuzu','Italika','JAC','Jeep','Jetour','Kawasaki','Kia','Land Rover','Lexus','Lincoln','Mazda','Mercedes-Benz','MG','Mini','Mitsubishi','Nissan','Peugeot','Pontiac','Ram','Renault','SEAT','Subaru','Suzuki','Tesla','Toyota','Volkswagen','Volvo','Yamaha'];
const vehicleColors = ['Blanco','Negro','Gris','Plata','Rojo','Azul','Verde','Beige','Café','Guinda','Amarillo','Naranja','Dorado','Morado','Rosa'];
function vehicleChoice(name, label, values, required) {
  return `<label>${label}<select name="${name}" ${required?'required':''} data-vehicle-choice><option value="">${required?'Selecciona un color':'No identificada'}</option>${values.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}<option value="__other__">Otro…</option></select></label><label data-other-for="${name}" hidden>Escribe ${label.toLowerCase()}<input name="${name}Other" maxlength="${name.endsWith('color')?50:60}" disabled autocomplete="off"></label>`;
}
function vehicleFields(prefix='') {
  return `<label>Tipo de vehículo<select name="${prefix}type">${Object.entries(types).map(([id,label])=>`<option value="${id}">${label}</option>`).join('')}</select></label><label>Placas<input name="${prefix}plate" maxlength="20" autocapitalize="characters" autocomplete="off" placeholder="Ej. ABC-123-A"></label><label class="checkbox-row full"><input name="${prefix}noPlate" type="checkbox" data-no-plate><span>Vehículo sin placas</span></label>${vehicleChoice(prefix+'brand','Marca',vehicleMakes,false)}${vehicleChoice(prefix+'color','Color',vehicleColors,true)}<details class="full vehicle-notes"><summary>Agregar seña particular u observación</summary><label class="gap-top">Señas para identificar el vehículo<input name="${prefix}notes" maxlength="500" placeholder="Ej. Golpe visible en puerta derecha"></label><p class="fine">Obligatorio si el vehículo no tiene placas.</p></details>`;
}
function syncVehicleFields(form) {
  for (const select of form.querySelectorAll('[data-vehicle-choice]')) {
    const other=form.elements[select.name+'Other'], active=select.value==='__other__';
    other.closest('label').hidden=!active; other.disabled=!active; other.required=active;
  }
  const noPlate=form.querySelector('[data-no-plate]');
  if(noPlate) {
    const prefix=noPlate.name.slice(0,-7), plate=form.elements[prefix+'plate'], notes=form.elements[prefix+'notes'];
    plate.disabled=noPlate.checked; plate.required=!noPlate.checked; notes.required=noPlate.checked;
    if(noPlate.checked) notes.closest('details').open=true;
  }
}
function setVehicleFields(form, vehicle) {
  for(const key of ['type','plate','notes']) form.elements[key].value=vehicle[key]||'';
  for(const key of ['brand','color']) {
    const value=vehicle[key]||'', select=form.elements[key];
    const listed=Array.from(select.options).some(o=>o.value===value);
    select.value=listed?value:'__other__'; form.elements[key+'Other'].value=listed?'':value;
  }
  form.elements.noPlate.checked=!vehicle.plate;
  if(vehicle.notes) form.elements.notes.closest('details').open=true;
  syncVehicleFields(form);
}
function readVehicleFields(form) {
  syncVehicleFields(form);
  return Object.fromEntries(['type','plate','brand','color','notes'].map(key=>{
    const field=form.elements[key];
    const value=key==='plate'&&form.elements.noPlate.checked?'':['brand','color'].includes(key)&&field.value==='__other__'?form.elements[key+'Other'].value:field.value;
    return [key,value.trim()];
  }));
}
document.addEventListener('change',event=>{
  if(event.target.matches('[data-vehicle-choice],[data-no-plate]')) syncVehicleFields(event.target.form);
});
