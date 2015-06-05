//создание обьекта события
var event = new CustomEvent('имя событмя',  { 'detail': "любые данные" });
//генерация события
elem.dispatchEvent(event); 