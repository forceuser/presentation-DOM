
// Функция-конструктор в js является подобием класса в классическом ООП
(function(){
    function SomeConstructor(options){//обычно мы хотим передать параметры инициализации в конструктор
        console.log("constructor context",this);// контекстом конструктора this является создаваемый объект
        this.options = {};
        this.options.someOption = (options||{}).someOption;
    }

    SomeConstructor.prototype = {
        doSomething: function(){
            console.log("something",this.options);
        }
    };
    SomeConstructor.prototype.constructor = SomeConstructor; // восстанавливаем исходное свойство constructor

    var someObj = new SomeConstructor();


    // Создадим новый конструктор на расширыв предыдущий

    function ChildConstructor(options,otherParameter){
        this.options = {};
        this.options.someOption2 = (options||{}).someOption2;
        this.options.someOption = (options||{}).someOption;// опять писать то же самое?
        this._otherParameter = otherParameter;
    }

    ChildConstructor.prototype = Object.create(SomeConstructor.prototype);
    ChildConstructor.prototype.constructor = ChildConstructor; // восстанавливаем исходное свойство constructor
    ChildConstructor.prototype.doSomethingElse = function(){ // Добавляем еще одид метод

    };
})();


// Попробуем немного оптимизировать код, создадим метод initialize который будет вызыватся из конструктора
(function(){
    function SomeConstructor(options){
        this.initialize&&this.initialize(options);
    }

    SomeConstructor.prototype = {
        initialize: function(options){
            this.options = {};
            this.options.someOption = (options||{}).someOption;
        },
        doSomething: function(){
            console.log("something",this.options);
        }
    };
    SomeConstructor.prototype.constructor = SomeConstructor; // восстанавливаем исходное свойство constructor
    var someObj = new SomeConstructor();


    // Создадим новый конструктор расширыв предыдущий

    function ChildConstructor(options,otherParameter){
        this.initialize&&this.initialize(options,otherParameter);
    }

    ChildConstructor.prototype = Object.create(SomeConstructor.prototype);
    ChildConstructor.prototype.constructor = ChildConstructor; // восстанавливаем исходное свойство constructor
    ChildConstructor.prototype.initialize = function(options,otherParameter){
        SomeConstructor.prototype.initialize.apply(this,arguments); // Выполняем унаследованный метод initialize
        this.options.someOption2 = (options||{}).someOption2;
        this._otherParameter = otherParameter;
    }
    ChildConstructor.prototype.doSomethingElse = function(){ // Добавляем еще одид метод

    };

    // Так уже лучше но все еще много повторяемого кода
    // Каждый раз переписывать тело конструктора
})();



// Напишем универсальный конструктор,
// все дальнейшие конструкторы будут генерироватся на основе его исходного кода
function universalConstructor() {
    // Сделаем возможность запускать конструктор не только как js коструктор
    // (т.е. не только используя ключевое слово new) например new universalConstructor();
    // но и как обычную функцию universalConstructor();
    // Что позволит использовать при создании обьектов метод apply, заранее не зная количесво параметров иницализации
    // Например так: var obj = universalConstructor.apply(this,arguments);


    // Для этого проверяем является ли текущий контекст(this) экземпляром universalConstructor
    // Если конструктор был запущен без new то его контекстом будет текущий контекст запуска фунции,
    // т.е. обычно это будет глобальный обьект window
    // Иначе его контекстом будет созданный обьект который является экземляром(instanceof) конструктора universalConstructor
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
// Эта функция аналог метода Object.assign() из ECMAScript6 (на данный момент реализован только в Firefox >=34)
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

// Сделаем конструктор для базового виджета
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

// Напишен утилитарные функции для работы с датой
var dateUtils = {
    getMonthFirstDay: function(date){//Вычисление первого дня месяца из указанной даты
        date = new Date(date);
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date;
    },
    getMonthLastDay: function(date){//Вычисление последнего дня месяца из указанной даты
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        date.setMonth(date.getMonth() + 1);
        date.setDate(date.getDate() - 1);
        return date;
    },
    getWeekFirstDay: function(date,weekFirstDay){//Вычисление первого дня недели из указанной даты и в завистимости
                                                   // от того какой день недели считается первым
        weekFirstDay = weekFirstDay||0;
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        var day = date.getDay() - weekFirstDay;
        date.setDate(date.getDate() - (day < 0 ? 7 + day : day));
        return date;
    },
    getWeekLastDay: function(date,weekFirstDay){//Вычисление поесденего дня недели из указанной даты и в завистимости
                                                   // от того какой день недели считается первым
        weekFirstDay = weekFirstDay||0;
        date = new Date(date);
        date.setHours(0, 0, 0, 0);
        var day = date.getDay() - weekFirstDay;
        date.setDate(date.getDate() + (6 - (day < 0 ? 7 + day : day)));
        return date;
    },
    getCalendarFirstDay: function(date,weekFirstDay){//Вычисление первого дня для отображения в календаре из указанной даты и в завистимости
                                                   // от того какой день недели считается первым
        return this.getWeekFirstDay(this.getMonthFirstDay(date),weekFirstDay);
    },
    getCalendarLastDay: function(date,weekFirstDay){//Вычисление поеследнего дня для отображения в календаре из указанной даты и в завистимости
                                                   // от того какой день недели считается первым
        return this.getWeekLastDay(this.getMonthLastDay(date),weekFirstDay);
    }
};

// Напишем базовый конструктор виджета календаря
var CalendarWidget = (function(CalendarWidget){
    CalendarWidget = Widget.extend("CalendarWidget",[EventMixin,{
        options: {
            weekFirstDay: 1, // Неделя начинается с понедельника
            dayNames: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'], // локализированные названия месяцев
            loadingText: "Загрузка.."
        },
        initialize: function(options){
            // Вызываем родительский метод initialize
            Widget.prototype.initialize.apply(this,arguments);
            // Вызываем initialize миксина EventMixin
            CalendarWidget._mixins[0].initialize.apply(this,arguments);
            // Устанавливаем опции с учетом опций по-умолчанию
            this.options = mixin({},this.options,options);
            this.domNode.classList.add("calendar");

            // Устанавливаем дату в таймауте для того чтобы успеть добавить обработчик события из основного кода
            setTimeout(function(){
                this.setDate(this.options.date);
            }.bind(this));
        },
        createLoadingIndicator: function(){
            var indicator = document.createElement("div");
            indicator.className = "loading-indicator";
            indicator.textContent = this.options.loadingText;
            return indicator;
        },
        createCell: function(date){
            var cellMonth = dateUtils.getMonthFirstDay(date);

            var cell = document.createElement("td");
            cell.className = 'cell';
            var container = document.createElement("div");
            container.className = "cell-container";
            var content = document.createElement("div");
            content.className = "cell-content";
            content.textContent = date.getDate();

            cell.appendChild(content);
            cell.appendChild(container);
            if(cellMonth.getTime()<this.date.getTime()){
                cell.classList.add("prev-month");
            }else if(cellMonth.getTime()<this.date.getTime()){
                cell.classList.add("next-month");
            }
            cell.setAttribute("year",date.getFullYear());
            cell.setAttribute("month",date.getMonth());
            cell.setAttribute("day",date.getDate());

            return cell;
        },
        showLoadingIndicator: function(){
            this.domNode.appendChild(this.createLoadingIndicator());
        },
        render: function(){
            if(!this._renderPrevented){
                this.clear();

                var cur = dateUtils.getCalendarFirstDay(this.date,this.options.weekFirstDay);
                var last = dateUtils.getCalendarLastDay(this.date,this.options.weekFirstDay);

                var table = document.createElement("table");
                table.className = "calendar-table";
                var tbody = document.createElement("tbody");
                table.appendChild(tbody);
                var row;
                while(cur.getTime()<=last.getTime()){
                    if(cur.getDay()===this.options.weekFirstDay){
                        row = document.createElement("tr");
                        row.className = "week-row";
                        tbody.appendChild(row);
                    }
                    row.appendChild(this.createCell(cur));
                    cur.setDate(cur.getDate()+1);
                }
                this.domNode.appendChild(table);
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
            this._date = dateUtils.getMonthFirstDay(this._date);
            if(!lastDate||(lastDate.getTime() !== this._date.getTime())){
                this.emit("changeDate",this._date);// генерируем событие изменения даты
                this.render();
            }
        },
        get date(){// геттер для даты, будет выполнятся при чтении из свойства .date
            return this._date;
        },
        set date(value){// сеттер для даты, будет выполнятся при записи в свойство .date
            this.setDate(value);
        }
    }]);
    return CalendarWidget;
})();


// Напишем конструктор расширенного виджета календаря
// который будет отображать праздники и выходные дни
var AdvancedCalendarWidget = (function(AdvancedCalendarWidget){
    AdvancedCalendarWidget = CalendarWidget.extend("AdvancedCalendarWidget",{
        markClasses: {
            HOLIDAY: 'holiday',
            DAY_OFF: 'day-off',
            SHORT: 'short-day'
        },
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
                cell.classList.add(this.markClasses[mark]||"");
                cell.appendChild(markEl);
            }
            return cell;
        }
    });
    return AdvancedCalendarWidget;
})();


var calendar = AdvancedCalendarWidget({
    date: new Date(2015,4,1)
});

// Повесим обработчик события на изменение даты в виджете
calendar.on("changeDate",function(date){
    this.preventRendering();
    this.clear();
    this.showLoadingIndicator();
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
calendar.appendTo(document.querySelector("body > .container"));