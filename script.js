// ----- script.js -----
(function() {
    // State
    let habits = [];
    let selectedIcon = 'fa-book';
    let selectedColor = '#6c5ce7';
    let editingHabitId = null;

    // DOM Elements
    const habitsContainer = document.getElementById('habitsContainer');
    const calendarContainer = document.getElementById('calendarContainer');
    const addHabitBtn = document.getElementById('addHabitBtn');
    const resetBtn = document.getElementById('resetBtn');

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
                name: 'Read 30 minutes',
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
        
        // Mark today as completed for demo
        habits.forEach(habit => {
            habit.history[todayStr] = true;
        });
        
        saveData();
    }

    // Generate unique ID
    function generateId(prefix = '') {
        return prefix + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }

    // Get last 30 days
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

    // Render calendar
    function renderCalendar() {
        if (!habits || habits.length === 0) {
            calendarContainer.innerHTML = `
                <div class="empty-state" style="padding: 2rem 1rem;">
                    <i class="fas fa-calendar-alt"></i>
                    <p>Add habits to see your calendar</p>
                </div>
            `;
            return;
        }

        const days = getLast30Days();
        const todayStr = formatDate(new Date());
        
        // For each habit, create a row in the calendar
        let html = '<div class="calendar-grid">';
        
        // Header row with day numbers
        html += `<div class="calendar-day" style="background: transparent; color: #b2bec3; font-weight: 700; font-size: 0.7rem;">Day</div>`;
        days.forEach(day => {
            const dayNum = day.getDate();
            const isToday = formatDate(day) === todayStr;
            html += `
                <div class="calendar-day" style="background: transparent; color: #b2bec3; font-weight: 600; font-size: 0.7rem; ${isToday ? 'border-color: #6c5ce7;' : ''}">
                    ${dayNum}
                </div>
            `;
        });
        
        // For each habit, show completion status
        habits.forEach(habit => {
            html += `<div class="calendar-day" style="background: transparent; color: #2d3436; font-weight: 600; font-size: 0.65rem; text-align: left; justify-content: flex-start; padding-left: 0.3rem;">
                <span style="display: flex; align-items: center; gap: 0.2rem;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${habit.color};"></span>
                    ${habit.icon ? `<i class="fas ${habit.icon}" style="font-size: 0.6rem;"></i>` : ''}
                </span>
            </div>`;
            
            days.forEach(day => {
                const dateStr = formatDate(day);
                const isCompleted = isHabitCompleted(habit, dateStr);
                const isToday = dateStr === todayStr;
                const isFuture = day > new Date();
                
                let status = 'future';
                let tooltip = '';
                
                if (isFuture) {
                    status = 'future';
                    tooltip = 'Future';
                } else if (isCompleted) {
                    status = 'completed';
                    tooltip = 'Completed';
                } else {
                    status = 'missed';
                    tooltip = 'Missed';
                }
                
                html += `
                    <div class="calendar-day ${status} ${isToday ? 'today' : ''}" title="${habit.name}: ${tooltip}">
                        <span class="day-status">${isCompleted ? '✓' : isFuture ? '·' : '✗'}</span>
                        <span class="day-tooltip">${habit.name}: ${tooltip}</span>
                    </div>
                `;
            });
        });
        
        html += '</div>';
        calendarContainer.innerHTML = html;
    }

    // Render all
    function renderAll() {
        renderHabits();
        renderCalendar();
    }

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