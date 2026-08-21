const app = Vue.createApp({
  data() {
    return {
     enteredGoalValue:'',
     enteredDuration:'',
     enteredPriority:'medium',
     goals: [],
     completedGoals: [],
     editingIndex:null,
     selectedPriority:'all',
     currentSection:'goals',
     errorMessage:'',
     editErrorMessage: '',
     darkMode:false,
     isAddingGoal: false,
     isSavingGoal: false,
     isCompletingGoal: false,
     isDeletingGoals:false,
    };
  },
  computed: {
    totalGoals() {
  return this.goals.length + this.completedGoals.length;
},

    completedCount() {
      return this.completedGoals.length;
    },

    overdueCount() {
      return this.goals.filter(goal => this.isOverdue(goal)).length;
    },

    activeCount() {
    return this.goals.length;
    },

    filteredGoals() {
        if (this.selectedPriority === 'all') {
          return this.goals;
        }

        return this.goals.filter(
          goal => goal.priority === this.selectedPriority
        );
      }
    },

  mounted() {
      this.fetchGoals();
    },

  methods:{
    async fetchGoals() {
  try {
    const response = await fetch('http://localhost:3000/api/goals');

    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }

    const goals = await response.json();

    const formattedGoals = goals.map(goal => ({
      ...goal,
      finishDate: goal.finish_date,
      completedDate: goal.completed_date
        ? new Date(goal.completed_date).toLocaleDateString()
        : null
    }));

    this.goals = formattedGoals.filter(goal => !goal.completed);
    this.completedGoals = formattedGoals.filter(goal => goal.completed);

  } catch (error) {
    console.error(error);
    this.errorMessage = 'Could not load your goals. Please try again.';
  }
},

    toggleDarkMode() {
      this.darkMode = !this.darkMode;
      document.body.classList.toggle('dark-mode', this.darkMode);
    },

    confirmFinish(goal) {
      if (confirm(`Are you sure you finished "${goal.title}"?`)) {
        this.removeGoal(goal);
      }
    },

    async deleteSelectedGoals() {
    const selectedGoals = this.completedGoals.filter(
      goal => goal.selected
    );

    if (selectedGoals.length === 0) {
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete ${selectedGoals.length} completed goal(s)?`
      )
    ) {
      return;
    }

    this.isDeletingGoals = true;

    try {
      for (const goal of selectedGoals) {
        const response = await fetch(
          `http://localhost:3000/api/goals/${goal.id}`,
          {
            method: 'DELETE'
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to delete goal ${goal.id}`
          );
        }
    }

    this.completedGoals = this.completedGoals.filter(
      goal => !goal.selected
    );
    this.isDeletingGoals = false;
  } catch (error) {
    console.error(error);

    this.errorMessage =
      'Could not delete one or more goals. Please try again.';
    this.isDeletingGoals = false;
    }
},

    cancelEdit() {
      this.editingIndex = null;
      this.editErrorMessage='';
    },

async saveGoal(goal) {
  this.editErrorMessage = '';

  if (goal.title.trim() === '') {
    this.editErrorMessage = 'Please enter a name for your goal.';
    return;
  }

  if (
    goal.duration !== '' &&
    Number(goal.duration) < 1
  ) {
    this.editErrorMessage = 'Duration must be at least 1 day.';
    return;
  }

  let finishDate = null;

  if (goal.duration !== '') {
    const today = new Date();

    today.setDate(
      today.getDate() + Number(goal.duration)
    );

    finishDate = today.toISOString().split('T')[0];

    goal.duration = Number(goal.duration);
  }
  this.isSavingGoal = true;

  try {
    const response = await fetch(
      `http://localhost:3000/api/goals/${goal.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: goal.title,
          duration:
            goal.duration === ''
              ? null
              : Number(goal.duration),
          finishDate: finishDate,
          priority: goal.priority,
          completed: goal.completed || false,
          completedDate: goal.completedDate || null
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to update goal');
    }

    const updatedGoal = await response.json();

    goal.title = updatedGoal.title;
    goal.duration = updatedGoal.duration;
    goal.finishDate = updatedGoal.finish_date;
    goal.priority = updatedGoal.priority;
    goal.completed = updatedGoal.completed;
    goal.completedDate = updatedGoal.completed_date;

    this.isSavingGoal = false;
    this.editingIndex = null;

  } catch (error) {
    
    console.error(error);
    this.editErrorMessage =
      'Could not save your changes. Please try again.';
    this.isSavingGoal = false;
  }
},
    editGoal(goal) {
        this.editErrorMessage = '';
        this.editingIndex = goal.id;
      },

async addGoal() {
  this.errorMessage = '';

  if (this.enteredGoalValue.trim() === '') {
    this.errorMessage = 'Please enter a name for your goal.';
    return;
  }

  if (
    this.enteredDuration !== '' &&
    Number(this.enteredDuration) < 1
  ) {
    this.errorMessage = 'Duration must be at least 1 day.';
    return;
  }

  let finishDate = null;

  if (this.enteredDuration !== '') {
    const today = new Date();

    today.setDate(
      today.getDate() + Number(this.enteredDuration)
    );

    finishDate = today.toISOString().split('T')[0];
  }
  this.isAddingGoal = true;
  try {
    const response = await fetch(
      'http://localhost:3000/api/goals',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: this.enteredGoalValue,
          duration:
            this.enteredDuration === ''
              ? null
              : Number(this.enteredDuration),
          finishDate: finishDate,
          priority: this.enteredPriority
        })
      }
    );

     if (!response.ok) {
        const errorData = await response.json();

        throw new Error(
          errorData.message || 'Failed to add goal'
        );
      }

    const newGoal = await response.json();

    this.goals.push({
      ...newGoal,
      finishDate: newGoal.finish_date,
      completedDate: newGoal.completed_date
    });

    this.enteredGoalValue = '';
    this.enteredDuration = '';
    this.enteredPriority = 'medium';

    this.isAddingGoal = false;

  } catch (error) {
    console.error(error);

    this.errorMessage =
      error.message ||
      'Could not add your goal. Please try again.';

    this.isAddingGoal = false;
  }
},
    formatDate(date) {
      return new Date(date).toLocaleDateString();
    },

async removeGoal(goal) {
  this.isCompletingGoal = true;
  try {
    const completedDate = new Date().toISOString().split('T')[0];

    const response = await fetch(
      `http://localhost:3000/api/goals/${goal.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: goal.title,
          duration: goal.duration,
          finishDate: goal.finishDate,
          priority: goal.priority,
          completed: true,
          completedDate: completedDate
        })
      }
    );

    if (!response.ok) {
      throw new Error('Failed to complete goal');
    }

    const updatedGoal = await response.json();

   const completedGoal = {
  ...updatedGoal,
  finishDate: updatedGoal.finish_date,
  completedDate: new Date(
    updatedGoal.completed_date
  ).toLocaleDateString()
};

    this.goals = this.goals.filter(
      currentGoal => currentGoal.id !== goal.id
    );

    this.completedGoals.push(completedGoal);
    this.isCompletingGoal = false;

  } catch (error) {
    console.error(error);
    this.errorMessage =
      'Could not complete the goal. Please try again.';
      this.isCompletingGoal = false;
  }
},
    isOverdue(goal) {
      if (goal.finishDate === 'Unknown') {
        return false;
      }

      const today = new Date();
      const finishDate = new Date(goal.finishDate);

      today.setHours(0, 0, 0, 0);
      finishDate.setHours(0, 0, 0, 0);

      return today > finishDate;
    },

}});

app.mount('#user-goals');
 