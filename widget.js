
// Функция-конструктор в js является подобием класса в классическом ООП

// Напишем универсальный конструктор,
// все дальнейшие конструкторы будут генерироватся на основе его исходного кода
function universalConstructor() {
    // Сделаем возможность запускать конструктор не только как js коструктор
    // (используя ключевое слово new) например new universalConstructor();
    // но и как обычную функцию universalConstructor();

    // Для этого проверяем является ли текущий контекст экземпляром universalConstructor
    // Если конструктор был запущен без new то его контекстом будет текущий контекст запуска фунции, т.е. обычно это будет window
    // Иначе его контекстом будет созданный обьект который является экземляром(instanceof) universalConstructor
    if (this instanceof universalConstructor) {
        //Выполняем метод initialize с переданными аргументами
        return this.initialize && this.initialize.apply(this, arguments);
    }
    else {
        // Для того чтобы вызвать конструктор с переданными аргументами заранее
        // не зная их количество нужно применить метод bind

        // Array.apply применяется для преобразования колекции arguments в обычный массив
        // без деоптимизации контекста выполнения (http://frontender.info/optimization-killers/#3obrabotkacodeargumentscode)


        return new (universalConstructor.bind.apply(universalConstructor, [null].concat(Array.apply(null, arguments))));


        // Для расшифровки этого кода представим, что вызвана universalConstructor(a,b,c);
        // в таком случае Array.apply(null, arguments) - вернет массив [a,b,c]
        //
        // Добавим в начало этого массива null
        //  (это будет контестом вызова конструктора, и на самом деле
        //   здесь можно передать любое значение,
        //   оно ни на что не влияет при вызове функции через new)
        //
        // [null].concat([a,b,c]) вернет массив [null,a,b,c]
        //
        // В итоге получим universalConstructor.bind.apply(universalConstructor,[null,a,b,c]);
        // Это можно представить в виде var fn = universalConstructor.bind(null,a,b,c);
        // И вызовем полученную функцию как конструктор без аргументов, используя new fn()
    }
}

// Функция mixin копирует все свойства (геттеры, сеттеры и неперечислимые свойства) из исходных обьектов source в обьект dest
function mixin(dest /*, source1..sourceN*/) {
    var source;
    // Перебираем все аргументы кроме первого
    for (var i = 1; i < arguments.length; i++) {
        source = arguments[i];
        if (!source) {
            continue;
        }
        // Получаем все имена собственных свойств обьекта source
        var keys = Object.getOwnPropertyNames(Object(source));
        for (var j = 0, l = keys.length; j < l; j++) {
            var key = keys[j];
            //Получение дескриторов исходного и целевого обьекта для копирования
            var sourceDescriptor = Object.getOwnPropertyDescriptor(source, key);
            var destDescriptor = Object.getOwnPropertyDescriptor(dest, key);

            // проверка на то, является ли свойство key обьекта dest настраиваемым(configurable),
            // делаем проверку т.к. нельзя перезаписать ненастраиваемое поле (интерпритатор выдаст ошибку)
            if (!destDescriptor || destDescriptor.configurable !== false) {
                sourceDescriptor.configurable = true;
                //Обьявляем свойство key в обьекте dest используя дескриптор sourceDescriptor исходного обьекта source
                Object.defineProperty(dest, key, sourceDescriptor);
            }
        }
    }
    return dest;
}


// Напишем функцию для создания новых контрукторов и расширения существующих
// параметры:
// name - имя которое будет дано функции конструктора
// source - исходный контсруктор на основе прототипа которого будет создан новый
// mixins - массив миксинов - обьектов свойства которых будут скопированы в прототип нового конструктора
// в mixins также может быть передан не массив а только один обьект(для удобства)
// staticProps - обьект свойства которого будут скопированы непосредственно в конструктор (подобие статических свойств в классическом ООП)

function declare(name, source, mixins, staticProps) {
    // name не обязательный параметр, проверяем - если не строка то смещаем все параметры на один
    if (!(name instanceof String || typeof name === "string")) {
        staticProps = mixins;
        mixins = source;
        source = name;
        name = "NamelessConstructor"; // "NamelessConstructor" - имя по-умолчанию
    }
    // Имя нужно для того чтобы создать именованный конструктор,
    // что позволит видеть в консоли имя конструктора создавшего обьект и проверять обьекты через instanceOf

    // Имя может быть


    // получаем исходный код функции универсльного конструктора universalConstructor
    // заменяем его имя на новое, указанное в параметре name

    var namedConstructorFnStr = universalConstructor.toString().replace(/universalConstructor/gm, name);
    // создаем именованный конструктор
    var constructor = (new Function("return " + namedConstructorFnStr + ";"))();
    // наследуем прототип источника если он указан
    if (source) {
        //для этого создаем обьект на основе прототипа источника и заменяем им прототип нового конструктора
        constructor.prototype = Object.create(source.prototype);
        // восстанавливаем свойство constructor после замены
        constructor.prototype.constructor = constructor;
        // Копируем все статические свойтсва исходного конструктора в текущий
        mixin(constructor,source);
    }
    constructor.name = name;
    // если указан параметр mixins
    if (mixins) {
        // принудительно преобразовываем его к массиву
        mixins = [].concat(mixins);
        // копируем все свойства из mixins в constructor.prototype
        constructor.prototype = mixin.apply(null, [constructor.prototype].concat(mixins));
    }
    //если указан параметр staticProps
    if (staticProps) {
        for (var pname in staticProps){
            if (staticProps.hasOwnProperty(pname)) {
                //копируем все свойства обьекта staticProps в constructor
                constructor[pname] = staticProps[pname];
            }
        }
    }

    // добавляем в constructor свойство _mixins, для возможности вызова при совпадении имен методов
    constructor._mixins = mixins || [];
    // добавляем утилитарный метод для удобного расширения, создания нового конструктора на основе текущего
    // получается нечто в стиле Backbone
    constructor.extend = function (name, mixins, staticProps) {
        return declare(name, constructor, mixins, staticProps);
    };

    return constructor;
}

// Теперь сделаем два базовых конструктора

// Конструктор обьекта
var ObjectExt = declare("ObjectExt");
// Конструктор массива
var ArrayExt = declare("ArrayExt",Array);
// К сожалению конструктор массива не будет создавать полноценные аналоги js массивов
// Это связано с тем что массивы являются особыми обьектами в текущих реализациях javascript
// Например не стоит добавлять элементы таким образом extArray[extArray.length] = 10; (extArray.length не будет увеличиватся)
// Также некоторые методы (например concat) не будут вести себя как ожидалось, поэтому их стоит переопределить
// Подробнее об этом можно почитать в статье
// Но все таки расширение массива может быть полезно, если например мы хотим создать что то на подобии JQuery


// Тепепь на основе этих базовых конструкторов можно создавать контрукторы используя extend

// Сделаем конструктор для виджета
var Widget = (function(Widget){
    Widget = ObjectExt.extend("Widget",{
        initialize: function(){
            this.domNode = document.createElement("div");
            this.domNode.classList.add(this.constructor.name);
        },
        clear: function(){
            //Очистка содержимого this.domNode
            //очищаем наиболее производительным методом
            while (this.domNode.lastChild) {
                this.domNode.removeChild(this.domNode.lastChild);
            }
        },
        appendTo: function(targetElement){
            targetElement&&targetElement.appendChild&&targetElement.appendChild(this.domNode);
        }
    });
    return Widget;
})();


// Создадим миксин для обработки событий

var EventMixin = (function(){
    //Для красоты используем WeakMap :)
    var eventMap = new WeakMap();

    var EventMixin = {
        initialize: function(){
            //Привязываем текущий обьект к хранилищу обработчиков событий
            eventMap.set(this,{});
        },
        on: function(eventName,callback){
            if(!callback) return;
            var eventStorage = eventMap.get(this);
            var callbacks = eventStorage[eventName] = eventStorage[eventName]||[];
            callbacks.push(callback);
            return this;
        },
        off: function(eventName,callback){
            var eventStorage = eventMap.get(this);
            var callbacks = eventStorage[eventName];
            if(callbacks){
                if(callback){
                    var idx = callbacks.indexOf(callback);
                    if(~idx){
                        callbacks.splice(idx,1);
                    }
                }else{
                    delete eventStorage[eventName];
                }
            }
            return this;
        },
        one: function(eventName,callback){
            var _callback;
            _callback = function(){
                callback.apply(this,arguments);
                this.off(eventName,_callback);
            }.bind(this);
            this.on(eventName,_callback);
            return this;
        },
        emit: function(eventName){
            var eventStorage = eventMap.get(this);
            var callbacks = eventStorage[eventName]||[];
            callbacks.forEach(function(args,callback){
                callback.apply(this,args);
            }.bind(this,Array.apply(null,arguments).slice(1)));
            return this;
        }
    };

    return EventMixin;
})();

var formatUtils = {
    pad: function(n, width, filler) {
        filler = filler || '0';
        n = n + '';
        return n.length >= width ? n : new Array(width - n.length + 1).join(filler) + n;
    }
};

var dateUtils = {
    getMonthFirstDay: function(date){
        date = new Date(date);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    },
    getMonthLastDay: function(date){
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + 1);
        date.setDate(date.getDate() - 1);
        return date;
    },
    getWeekFirstDay: function(date,weekFirstDay){
        weekFirstDay = weekFirstDay||0;
        date = new Date(date);
        var day = date.getDay() - weekFirstDay;
        date.setDate(date.getDate() - (day < 0 ? 7 + day : day));
        return date;
    },
    getWeekLastDay: function(date,weekFirstDay){
        weekFirstDay = weekFirstDay||0;
        date = new Date(date);
        var day = date.getDay() - weekFirstDay;
        date.setDate(date.getDate() + (6 - (day < 0 ? 7 + day : day)));
        return date;
    },
    getCalendarFirstDay: function(date,weekFirstDay){
        return this.getWeekFirstDay(this.getMonthFirstDay(date),weekFirstDay);
    },
    getCalendarLastDay: function(date,weekFirstDay){
        return this.getWeekLastDay(this.getMonthLastDay(date),weekFirstDay);
    }
};


var CalendarWidget = (function(CalendarWidget){
    CalendarWidget = Widget.extend("CalendarWidget",[EventMixin,{
        options: {
            weekFirstDay: 1, // Неделя начинается с понедельника
            dayNames: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] // локализированные названия месяцев
        },
        initialize: function(options){
            // Вызываем родительский метод initialize
            Widget.prototype.initialize.apply(this,arguments);
            // Вызываем initialize миксина EventMixin
            CalendarWidget._mixins[0].initialize.apply(this,arguments);
            // Устанавливаем опции с учетом опций по-умолчанию
            this.options = mixin({},this.options,options);

            // Устанавливаем дату в таймауте для того чтобы успеть добавить обработчик события из основного кода
            setTimeout(function(){
                this.setDate(this.options.date);
            }.bind(this));
        },
        createCell: function(){

        },
        render: function(){
            if(!this._renderPrevented){

            }
        },
        preventRendering: function(){
            this._renderPrevented = true;
        },
        allowRendering: function(){
            this._renderPrevented = false;
        },
        setDate: function(value){
            var lastDate = this._date;
            this._date = new Date(value);
            if(!lastDate||(lastDate.getTime() !== this._date.getTime())){
                this.emit("changeDate",this._date);
                this.render();
            }
        },
        get date(){
            return this._date;
        },
        set date(value){
            this.setDate(value);
        }
    }]);
    return CalendarWidget;
})();

var AdvancedCalendarWidget = (function(AdvancedCalendarWidget){
    AdvancedCalendarWidget = CalendarWidget.extend("AdvancedCalendarWidget",{
        setMarks: function(marks){
            this._marks = marks;
            this.render();
        },
        getMark: function(date){
            if(this._marks){
                var year = date.getFullYear();
                var month = date.getMonth();
                var day = date.getDate();
                return this._marks[year+"-"+formatUtils.pad(month+1,2)+"-"+formatUtils.pad(day,2)];
            }
        },
        createCell: function(date){
            var cell = CalendarWidget.prototype.createCell.apply(this,arguments);
            var mark = this.getMark(date);
            if(mark){
                var markEl = document.createElement("div");
                markEl.classList.add("cell-background");
                markEl.classList.add(mark);
                cell.querySelector(".cell-container").appendChild(markEl);
            }
            return cell;
        }
    });
    return AdvancedCalendarWidget;
})();


var calendar = AdvancedCalendarWidget({
    date: new Date(2015,4,1)
});

calendar.on("changeDate",function(date){
    this.preventRendering();
    // Например грузим пометки ajax запросом
    // Но для простоты сделаю эмуляцию через таймаут
    setTimeout(function(){
        this.allowRendering();
        this.setMarks({
            "2015-05-01":"HOLIDAY",
            "2015-05-02":"HOLIDAY",
            "2015-05-03":"DAY_OFF",
            "2015-05-04":"DAY_OFF",
            "2015-05-08":"SHORT",
            "2015-05-09":"HOLIDAY",
            "2015-05-10":"DAY_OFF",
            "2015-05-11":"DAY_OFF",
            "2015-05-16":"DAY_OFF",
            "2015-05-17":"DAY_OFF",
            "2015-05-23":"DAY_OFF",
            "2015-05-24":"DAY_OFF",
            "2015-05-30":"DAY_OFF",
            "2015-05-31":"HOLIDAY"
        });
    }.bind(this),3000);

    console.log("ON CHANGE",date);
});

console.log("calendar",calendar);
calendar.appendTo(document.body);




// var calendar = MarkedCalendar({
//     date: new Date(2015, 7, 1)
// });

// console.log("calendar", calendar);
// calendar.appendTo(document.body);