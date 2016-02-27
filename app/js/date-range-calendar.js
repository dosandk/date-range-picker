;(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([''], function() {

        });
    }
    else if (typeof exports !== 'undefined') {

    }
    else {
        root.Calendar = factory();
    }

}(this, function() {

    var dateHelper = {
        getNumberDaysInMonth: function(month, year) {
            var self = this;
            var date = new Date();
            var currentYear = typeof year !== 'undefined' ?  year : date.getFullYear();
            var currentMonth = typeof month !== 'undefined' ? month : date.getMonth();

            return new Date(currentYear, currentMonth + 1, 0).getDate();
        },
        /*getMonthFirstDay: function(month, year) {
            var self = this;
            var date = new Date();
            var currentYear = typeof year !== 'undefined' ?  year : date.getFullYear();
            var currentMonth = typeof month !== 'undefined' ? month : date.getMonth();

            return new Date(currentYear, currentMonth, 1);
        },*/
        getMonthLastDay: function(month, year) {
            var self = this;
            var date = new Date();
            var currentYear = typeof year !== 'undefined' ?  year : date.getFullYear();
            var currentMonth = typeof month !== 'undefined' ? month : date.getMonth();

            return new Date(currentYear, currentMonth + 1, 0);
        }
    };

    var dom = {
        createElement: function(elemName) {
            var elementName = elemName || 'div';

            return document.createElement(elementName);
        },
        addClass: function(element, classNames) {
            return element.className = classNames;
        }
    };

    var config = {
        fragmentsNumber: 2,
        daysPerWeek: 7,
        daysNames: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
        monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
    };

    var fragmentsManager = {
        fragments: {},
        selectedDateRange: {
            start: null,
            end: null
        },
        initMonthSwitchingEvent: function(elem) {
            var self = this;
            var arrows = elem.querySelectorAll('span[class^="js-arrow-"]');
            var arrowIndex = arrows.length;

            while (arrowIndex--) {
                arrows[arrowIndex].addEventListener('click', function(e) {
                    var month = parseInt(e.currentTarget.getAttribute('data-month'), 10);
                    var state = e.currentTarget.getAttribute('data-state');
                    var currentYear = parseInt(e.currentTarget.getAttribute('data-year'), 10);
                    var nextYear;
                    var nextMonth;

                    switch (state) {
                        case 'prev':
                            nextMonth = month - 1;
                            break;
                        case 'next':
                            nextMonth = month + 1;
                            break;
                    }

                    if (nextMonth < 0) {
                        nextYear = currentYear - 1;
                        nextMonth = 11;
                    }
                    else if (nextMonth > 11) {
                        nextYear = currentYear + 1;
                        nextMonth = 0;
                    }

                    self.updateFragment({
                        year: currentYear,
                        nextYear: nextYear,
                        monthIndex: month,
                        nextMonthIndex: nextMonth
                    });
                });
            }
        },
        renderAllFragments: function() {
            var self = this;

            for (var i in self.fragments) {
                var fragment = self.fragments[i].fragmentHtml;
                var field = self.fragments[i].containerClassName;

                document.querySelector(field).appendChild(fragment);

                self.initListeners(fragment);
            }
        },
        renderFragment: function(fragmentIndex) {
            var self = this;

            if (typeof fragmentIndex !== 'undefined') {
                var calendarObj = self.fragments[fragmentIndex];
                var container = document.querySelector(calendarObj.containerClassName);

                container.innerHTML = '';
                container.appendChild(calendarObj.fragmentHtml);

                self.initListeners(container);
            }
        },
        setFragments: function(data) {
            var self = this;
            var monthIndex = data.monthIndex;
            var containerClassName = data.containerClassName;
            var fragmentHtml = data.fragmentHtml;
            var currentYear = data.year;
            var fragmentIndex = currentYear + '-' + monthIndex;

            self.fragments[fragmentIndex] = {
                year: currentYear,
                name: config.monthNames[monthIndex],
                index: monthIndex,
                containerClassName: containerClassName,
                fragmentHtml: fragmentHtml
            };
        },
        updateFragment: function(data) {
            var self = this;
            var monthIndex = data.monthIndex;
            var nextMonthIndex = data.nextMonthIndex;
            var currentYear = data.year;
            var currentCalendar = self.fragments[currentYear + '-' + monthIndex];
            var nextYear = typeof data.nextYear !== 'undefined' ? data.nextYear : currentCalendar.year;
            var calendarHtml = fragmentsFactory.creteFragment(nextMonthIndex, nextYear);

            if (typeof self.fragments[nextYear + '-' + nextMonthIndex] !== 'undefined') {
                console.error('this month already exist');
            }
            else  {
                var currentFragmentIndex = currentYear + '-' + monthIndex;
                var nextFragmentIndex = nextYear + '-' + nextMonthIndex;

                currentCalendar.year = nextYear;
                currentCalendar.index = nextMonthIndex;
                currentCalendar.name = config.monthNames[nextMonthIndex];
                currentCalendar.fragmentHtml = calendarHtml;

                self.fragments[nextFragmentIndex] = currentCalendar;
                delete self.fragments[currentFragmentIndex];

                self.renderFragment(nextFragmentIndex);
            }

            console.log(self);

        },
        initListeners: function(elem) {
            var self = this;

            self.initMonthSwitchingEvent(elem);
            self.initGetTimestampEvent(elem);
        },
        initGetTimestampEvent: function(elem) {
            var self = this;
            var tbody = elem.querySelector('tbody');

            tbody.addEventListener('click', function(e) {
                var target = e.target;
                var classListArr = Array.prototype.slice.call(target.classList);

                if (classListArr.indexOf('day') >= 0) {
                    var timestamp = parseInt(target.getAttribute('data-timestamp'), 10);

                    if (classListArr.indexOf('selected') >= 0) {
                        var targetTimestamp = parseInt(target.getAttribute('data-timestamp'), 10);

                        target.classList.remove('selected');

                        if (self.selectedDateRange.start === targetTimestamp) {
                            self.selectedDateRange.start = self.selectedDateRange.end;
                            self.selectedDateRange.end = null;
                        }
                        if (self.selectedDateRange.end === targetTimestamp) {
                            self.selectedDateRange.end = null;
                        }
                    }
                    else {
                        if (self.selectedDateRange.start && self.selectedDateRange.end) {
                            self.selectedDateRange.start = null;
                            self.selectedDateRange.end = null;

                            var sidesContainer = document.querySelector('.sides-container');
                            var selectedDays = sidesContainer.querySelectorAll('.selected');
                            var hoveredDays = sidesContainer.querySelectorAll('.hovered');
                            var hoveredDaysArr = Array.prototype.slice.call(hoveredDays);
                            var selectedDaysArr = Array.prototype.slice.call(selectedDays);

                            selectedDaysArr.forEach(function(cell) {
                                cell.classList.remove('selected');
                            });

                            hoveredDaysArr.forEach(function(cell) {
                                cell.classList.remove('hovered');
                            });
                        }

                        if (!self.selectedDateRange.start) {
                            self.selectedDateRange.start = timestamp;
                        }
                        else if (!self.selectedDateRange.end) {
                            self.selectedDateRange.end = timestamp;
                        }

                        target.classList.add('selected');
                    }
                }
            });
        }
    };

    var fragmentsFactory = {
        creteFragment: function(month, year) {
            var self = this;
            var currentMonth = typeof month !== 'undefined' ? month : calendar.month;
            var currentYear = typeof year !== 'undefined' ? year : calendar.year;
            var table = dom.createElement('table');
            var daysPerWeek = config.daysPerWeek;
            var daysNames = config.daysNames;

            dom.addClass(table, 'fixed-table-layout parent-width txt-align-center');

            function createTableCaption() {
                var monthName = config.monthNames[currentMonth];
                var tableCaption = dom.createElement('caption');
                var text = document.createTextNode(monthName + ' ' + currentYear);

                function createNavigation() {
                    var leftArrow = dom.createElement('span');
                    var leftArrowIcon = document.createTextNode('<<');

                    dom.addClass(leftArrow, 'js-arrow-left-' + currentMonth);

                    leftArrow.setAttribute('data-month', currentMonth);
                    leftArrow.setAttribute('data-state', 'prev');
                    leftArrow.setAttribute('data-year', currentYear);
                    leftArrow.appendChild(leftArrowIcon);

                    var rightArrow = dom.createElement('span');
                    var rightArrowIcon = document.createTextNode('>>');

                    dom.addClass(rightArrow, 'js-arrow-right-' + currentMonth);

                    rightArrow.setAttribute('data-month', currentMonth);
                    rightArrow.setAttribute('data-state', 'next');
                    rightArrow.setAttribute('data-year', currentYear);
                    rightArrow.appendChild(rightArrowIcon);

                    return {
                        leftArrow: leftArrow,
                        rightArrow: rightArrow
                    }
                }

                var arrows = createNavigation();

                tableCaption.appendChild(arrows.leftArrow);
                tableCaption.appendChild(text);
                tableCaption.appendChild(arrows.rightArrow);

                return tableCaption;
            }

            function createTableHeader() {
                var tableHeader = dom.createElement('thead');
                var row = dom.createElement('tr');

                for (var i = 0; i < daysNames.length; i++) {
                    var cell = dom.createElement('td');
                    var text = document.createTextNode(daysNames[i]);

                    cell.appendChild(text);
                    row.appendChild(cell);
                }

                tableHeader.appendChild(row);

                return tableHeader;
            }

            function createTableBody() {
                var tableBody = dom.createElement('tbody');
                var daysInMonth = dateHelper.getNumberDaysInMonth(currentMonth, currentYear);
                var startCounter = 0;
                var daysCounter = 1;
                var firstDay = daysNames[new Date(currentYear, currentMonth, 1).getDay()];
                var startIndex = daysNames.indexOf(firstDay);
                var weeksCounter = Math.ceil((daysInMonth + startIndex)/daysPerWeek);

                function createCells() {
                    var cells = document.createDocumentFragment();
                    var dayIndex = 0;
                    var cell;
                    var text;

                    for (dayIndex; dayIndex < daysPerWeek; dayIndex++) {
                        if (daysCounter <= daysInMonth) {
                            cell = dom.createElement('td');
                            text = document.createTextNode('');

                            if (startCounter >= startIndex) {
                                var date = new Date();
                                var nowYear = date.getFullYear();
                                var nowMonth = date.getMonth();
                                var nowDay = date.getDate();
                                var nowTimestamp = new Date(nowYear, nowMonth, nowDay).getTime();
                                var dayTimestamp = new Date(currentYear, currentMonth, daysCounter).getTime();

                                text = document.createTextNode(daysCounter);
                                cell.setAttribute('data-timestamp', dayTimestamp);

                                dom.addClass(cell, 'day');

                                if (nowTimestamp === dayTimestamp) {
                                    dom.addClass(cell, 'day active')
                                }

                                if (fragmentsManager.selectedDateRange.start === dayTimestamp) {
                                    dom.addClass(cell, 'day selected')
                                }

                                if (fragmentsManager.selectedDateRange.end === dayTimestamp) {
                                    dom.addClass(cell, 'day selected')
                                }

                                daysCounter++;
                            }

                            cell.appendChild(text);
                            cells.appendChild(cell);

                            startCounter++;
                        }
                    }

                    return cells;
                }

                function createRows() {
                    var rows = document.createDocumentFragment();
                    var weekIndex = 0;
                    var row;
                    var week;

                    for (weekIndex; weekIndex < weeksCounter; weekIndex++) {
                        row = dom.createElement('tr');
                        week = createCells();

                        row.appendChild(week);
                        rows.appendChild(row);
                    }

                    return rows;
                }

                tableBody.appendChild(createRows());

                return tableBody;
            }

            table.appendChild(createTableCaption());
            table.appendChild(createTableHeader());
            table.appendChild(createTableBody());

            return table;
        },
        creteFragmentContainer: function(month, year) {
            var mainContainer = document.querySelector('.sides-container');
            var container = dom.createElement();
            var sideName = fragmentsManager.fragments[year + '-' + month].containerClassName;

            dom.addClass(container, sideName.slice(1) + ' display-table-cell');

            mainContainer.appendChild(container);
        }
    };

    var calendar = {
        createCalendarContainer: function() {
            var mainContainer = document.getElementById('calendar-container');
            var field = dom.createElement();

            dom.addClass(field, 'sides-container display-table parent-size');
            mainContainer.appendChild(field);
        },
        initFragments: function() {
            var self = this;
            var currentMonth = self.month;
            var currentYear = self.year;

            for (var i = 0; i < config.fragmentsNumber; i++) {
                fragmentsManager.setFragments({
                    year: currentYear,
                    monthIndex: currentMonth,
                    fragmentHtml: fragmentsFactory.creteFragment(currentMonth, currentYear),
                    containerClassName: '.side-' + currentMonth
                });

                fragmentsFactory.creteFragmentContainer(currentMonth, currentYear);

                if (currentMonth < 11) {
                    currentMonth++;
                }
                else {
                    currentYear++;
                    currentMonth = 0;
                }
            }
        },
        render: function(month, year) {
            var self = this;

            self.month = month;
            self.year = year;

            self.initFragments();
            fragmentsManager.renderAllFragments();

            self.initListeners();
        },
        initListeners: function() {
            var self = this;

            self.initCellHoverEffect();
        },
        initCellHoverEffect: function() {
            var self = this;
            var sidesContainer = document.querySelector('.sides-container');

            sidesContainer.addEventListener('mouseover', function(e) {
                if (fragmentsManager.selectedDateRange.start && !fragmentsManager.selectedDateRange.end) {
                    var target = e.target;
                    var targetClassList = target.classList;
                    var targetClassListArr = Array.prototype.slice.call(targetClassList);

                    if (targetClassListArr.indexOf('day') >= 0) {
                        var timestamp = parseInt(e.target.getAttribute('data-timestamp'), 10);

                        self.hoverCells(timestamp);
                    }
                }
            });

        },
        hoverCells: function(timestamp) {
            var sidesContainer = document.querySelector('.sides-container');
            var cells = sidesContainer.querySelectorAll('.day');
            var cellsArr = Array.prototype.slice.call(cells);

            cellsArr.forEach(function(cell) {
                var cellTimestamp = parseInt(cell.getAttribute('data-timestamp'), 10);

                if (cellTimestamp < timestamp && cellTimestamp > fragmentsManager.selectedDateRange.start) {
                    cell.classList.add('hovered');
                }
                else if (cellTimestamp > timestamp && cellTimestamp < fragmentsManager.selectedDateRange.start) {
                    cell.classList.add('hovered');
                }
                else {
                    cell.classList.remove('hovered');
                }
            });
        }
    };

    return {
        initialize: function() {
            console.error('init calendar');
            calendar.createCalendarContainer();
        },
        generateMonth: function() {
            var month = 1;
            var year = 2016;

            calendar.render(month, year);
        }
    }
}));