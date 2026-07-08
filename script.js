// ----- script.js -----
(function() {
    // State
    let habits = [];
    let selectedIcon = 'fa-book';
    let selectedColor = '#6c5ce7';
    let editingHabitId = null;
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();

    // DOM Elements
    const habitsContainer = document.getElementById('habitsContainer');
    const calendarContainer = document.getElementById('calendarContainer');
    const addHabitBtn = document.getElementById('addHabitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const monthLabel = document.getElementById('monthLabel');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    // Modal
    const habitModal = document.getElementById('habitModal');
    const habitNameInput = document.getElementById('habitNameInput');
    const iconOptions = document.querySelectorAll('.icon-option');
    const colorOptions = document.querySelectorAll('#habitColorOptions .color-option');
    const saveHabitBtn = document.getElementById('saveHabitBtn');
    const cancelModal = document.getElementById('cancelModal');
    const closeModal = document.getElementById('closeModal');

    // Load data from localStorage
    function loadData() {
        const stored = localStorage.getItem('habitData');
        if (stored) {
            try {
                habits = JSON.parse(stored);
                return true;
            } catch (e) {
                console.error('Error loading data:', e);
                return false;
            }
        }
        return false;
    }

    // Save data to localStorage
    function saveData() {
        try {
            localStorage.setItem('habitData', JSON.stringify(habits));
        } catch (e) {
            console.error('Error saving data:', e);
        }
    }

    // Initialize default habits
    function initDefaultHabits() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        habits = [
            {
                id: 'habit-1',
                name: 'Read 30 min',
                icon: 'fa-book',
                color: '#6c5ce7',
                history: {}
            },
            {
                id: 'habit-2',
                name: 'Exercise',
                icon: 'fa-dumbbell',
                color: '#00b894',
                history: {}
            },
            {
                id: 'habit-3',
                name: 'Meditate',
                icon: 'fa-yoga',
                color: '#fdcb6e',
                history: {}
            }
        ];
        
        // Mark some demo data
        const demoHistory = {};
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            // 80% chance of completion for demo
            if (Math.random() > 0.2) {
                demoHistory[dateStr] = true;
            }
        }
        habits.forEach(habit => {
            habit.history = {...demoHistory};
            // Make sure today is completed
            habit.history[todayStr] = true;
        });
        
        saveData();
    }

    // Generate unique ID
    function generateId(prefix = '') {
        return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    // Format date to YYYY-MM-DD
    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }

    // Check if habit was completed on a specific date
    function isHabitCompleted(habit, dateStr) {
        return habit.history && habit.history[dateStr] === true;
    }

    // Calculate streak for a habit
    function calculateStreak(habit) {
        let streak = 0;
        const today = new Date();
        const todayStr = formatDate(today);
        
        // Check if today is completed, if not, streak is 0
        if (!isHabitCompleted(habit, todayStr)) {
            // Check yesterday
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = formatDate(yesterday);
            
            // If yesterday was completed, streak starts from yesterday
            if (isHabitCompleted(habit, yesterdayStr)) {
                streak = 1;
                // Count backwards from yesterday
                let checkDate = new Date(yesterday);
                checkDate.setDate(checkDate.getDate() - 1);
                while (true) {
                    const checkStr = formatDate(checkDate);
                    if (isHabitCompleted(habit, checkStr)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }
            }
            return streak;
        }
        
        // Today is completed, count streak
        streak = 1;
        let checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - 1);
        while (true) {
            const checkStr = formatDate(checkDate);
            if (isHabitCompleted(habit, checkStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        return streak;
    }

    // Get days for the current month view
    function getMonthDays() {
        const days = [];
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const today = new Date();
        
        // Start from the first day of the month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(currentYear, currentMonth, d);
            days.push(date);
        }
        
        return days;
    }

    // Get last 30 days from today
    function getLast30Days() {
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    }

    // Render habits
    function renderHabits() {
        if (!habits || habits.length === 0) {
            habitsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>No habits yet</p>
                    <p style="font-size: 0.8rem; opacity: 0.7;">Click "Add Habit" to get started</p>
                </div>
            `;
            return;
        }

        let html = '';
        habits.forEach(habit => {
            const streak = calculateStreak(habit);
            const todayStr = formatDate(new Date());
            const isCompletedToday = isHabitCompleted(habit, todayStr);
            
            html += `
                <div class="habit-item" style="border-left-color: ${habit.color};">
                    <div class="habit-icon" style="background: ${habit.color};">
                        <i class="fas ${habit.icon}"></i>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-streak">
                            <i class="fas fa-fire"></i>
                            ${streak} day${streak !== 1 ? 's' : ''} streak
                        </div>
                    </div>
                    <div class="habit-actions">
                        <button class="today-btn ${isCompletedToday ? 'completed' : ''}" data-habit-id="${habit.id}">
                            ${isCompletedToday ? '<i class="fas fa-check"></i> Done' : '<i class="fas fa-plus"></i> Today'}
                        </button>
                        <button class="habit-delete" data-habit-id="${habit.id}" title="Delete habit">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `;
        });

        habitsContainer.innerHTML = html;

        // Attach event listeners
        document.querySelectorAll('.today-btn').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const habitId = this.dataset.habitId;
                toggleHabitToday(habitId);
            };
        });

        document.querySelectorAll('.habit-delete').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                const habitId = this.dataset.habitId;
                if (confirm('Delete this habit and all its history?')) {
                    habits = habits.filter(h => h.id !== habitId);
                    saveData();
                    renderAll();
                }
            };
        });
    }

    // Render heatmap calendar
    function renderCalendar() {
        if (!habits || habits.length === 0) {
            calendarContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem;">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Add habits to see your heatmap</p>
                </div>
            `;
            return;
        }

        const days = getLast30Days();
        const todayStr = formatDate(new Date());
        
        // Update month label
        const today = new Date();
        monthLabel.textContent = `${today.toLocaleString('default', { month: 'long' })} ${today.getFullYear()}`;

        let html = '';
        
        // Day labels
        html += '<div class="day-labels">';
        html += '<div class="day-label">Habit</div>';
        days.forEach(day => {
            const dayNum = day.getDate();
            const isToday = formatDate(day) === todayStr;
            html += `
                <div class="day-label" style="${isToday ? 'color: #6c5ce7; font-weight: 700;' : ''}">
                    ${dayNum}
                </div>
            `;
        });
        html += '</div>';

        // Heatmap rows for each habit
        habits.forEach(habit => {
            html += `<div class="heatmap-row">`;
            
            // Habit label
            html += `
                <div class="heatmap-label" title="${habit.name}">
                    <span class="habit-dot" style="background: ${habit.color};"></span>
                    <span>${habit.name.substring(0, 8)}</span>
                </div>
            `;
            
            // Cells for each day
            days.forEach(day => {
                const dateStr = formatDate(day);
                const isCompleted = isHabitCompleted(habit, dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = day > new Date();
                
                let status = 'future';
                let tooltipText = `${habit.name}: `;
                
                if (isFuture) {
                    status = 'future';
                    tooltipText += 'Future';
                } else if (isCompleted) {
                    status = 'completed';
                    tooltipText += '✅ Completed';
                } else {
                    status = 'missed';
                    tooltipText += '❌ Missed';
                }
                
                const dayNum = day.getDate();
                const month = day.toLocaleString('default', { month: 'short' });
                const year = day.getFullYear();
                
                html += `
                    <div class="heatmap-cell ${status} ${isToday ? 'today' : ''}" 
                         onclick="window.toggleDay && window.toggleDay('${habit.id}', '${dateStr}')"
                         title="${tooltipText}">
                        <span class="cell-tooltip">
                            ${month} ${dayNum}, ${year}<br>
                            ${habit.name}<br>
                            ${isFuture ? 'Future' : isCompleted ? '✅ Completed' : '❌ Missed'}
                        </span>
                    </div>
                `;
            });
            
            html += '</div>';
        });

        calendarContainer.innerHTML = html;
    }

    // Toggle day completion
    window.toggleDay = function(habitId, dateStr) {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;
        
        const today = new Date();
        const todayStr = formatDate(today);
        const targetDate = new Date(dateStr);
        
        // Don't allow toggling future dates or past dates (only today)
        if (targetDate > today) {
            alert('Cannot toggle future dates');
            return;
        }
        
        if (dateStr !== todayStr) {
            alert('You can only toggle today\'s status');
            return;
        }
        
        if (!habit.history) {
            habit.history = {};
        }
        
        if (habit.history[dateStr]) {
            delete habit.history[dateStr];
        } else {
            habit.history[dateStr] = true;
        }
        
        saveData();
        renderAll();
    };

    // Toggle habit for today
    function toggleHabitToday(habitId) {
        const habit = habits.find(h => h.id === habitId);
        if (!habit) return;

        const todayStr = formatDate(new Date());
        
        if (!habit.history) {
            habit.history = {};
        }
        
        if (habit.history[todayStr]) {
            delete habit.history[todayStr];
        } else {
            habit.history[todayStr] = true;
        }
        
        saveData();
        renderAll();
    }

    // Render all
    function renderAll() {
        renderHabits();
        renderCalendar();
    }

    // Save habit (add or update)
    function saveHabit() {
        const name = habitNameInput.value.trim();
        if (!name) {
            alert('Please enter a habit name');
            habitNameInput.focus();
            return;
        }

        if (editingHabitId) {
            // Update existing habit
            const habit = habits.find(h => h.id === editingHabitId);
            if (habit) {
                habit.name = name;
                habit.icon = selectedIcon;
                habit.color = selectedColor;
            }
            editingHabitId = null;
        } else {
            // Add new habit
            habits.push({
                id: generateId('habit-'),
                name: name,
                icon: selectedIcon,
                color: selectedColor,
                history: {}
            });
        }

        saveData();
        renderAll();
        closeHabitModal();
    }

    // Open habit modal
    function openHabitModal(habitId = null) {
        editingHabitId = habitId;

        if (habitId) {
            // Edit mode
            const habit = habits.find(h => h.id === habitId);
            if (!habit) return;

            habitNameInput.value = habit.name;
            selectedIcon = habit.icon || 'fa-book';
            selectedColor = habit.color || '#6c5ce7';
            saveHabitBtn.innerHTML = '<i class="fas fa-save"></i> Update Habit';
            document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-edit"></i> Edit Habit';
        } else {
            // Add mode
            habitNameInput.value = '';
            selectedIcon = 'fa-book';
            selectedColor = '#6c5ce7';
            saveHabitBtn.innerHTML = '<i class="fas fa-save"></i> Add Habit';
            document.querySelector('.modal-header h3').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Habit';
        }

        // Update icon selection
        iconOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.icon === selectedIcon);
        });

        // Update color selection
        colorOptions.forEach(opt => {
            opt.classList.toggle('active', opt.dataset.color === selectedColor);
        });

        habitModal.classList.add('active');
        setTimeout(() => habitNameInput.focus(), 100);
    }

    // Close habit modal
    function closeHabitModal() {
        habitModal.classList.remove('active');
        editingHabitId = null;
    }

    // Reset all data
    function resetAll() {
        if (confirm('Reset all habits and history? This cannot be undone.')) {
            initDefaultHabits();
            renderAll();
        }
    }

    // Change month
    function changeMonth(delta) {
        currentMonth += delta;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        } else if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderAll();
    }

    // Icon selection
    iconOptions.forEach(opt => {
        opt.addEventListener('click', function() {
            iconOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            selectedIcon = this.dataset.icon;
        });
    });

    // Color selection
    colorOptions.forEach(opt => {
        opt.addEventListener('click', function() {
            colorOptions.forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            selectedColor = this.dataset.color;
        });
    });

    // Event listeners for modals
    saveHabitBtn.addEventListener('click', saveHabit);
    cancelModal.addEventListener('click', closeHabitModal);
    closeModal.addEventListener('click', closeHabitModal);

    addHabitBtn.addEventListener('click', () => openHabitModal());
    resetBtn.addEventListener('click', resetAll);
    prevMonthBtn.addEventListener('click', () => changeMonth(-1));
    nextMonthBtn.addEventListener('click', () => changeMonth(1));

    // Close modal on outside click
    habitModal.addEventListener('click', function(e) {
        if (e.target === this) closeHabitModal();
    });

    // Enter key support
    habitNameInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveHabit();
        }
    });

    // Initialize
    if (!loadData()) {
        initDefaultHabits();
    }
    renderAll();

    console.log('Habit Streak Tracker initialized');
})();