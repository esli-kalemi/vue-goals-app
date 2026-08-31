const API_URL = 'http://localhost:3000';

const app = Vue.createApp({
  data() {
    return {
      registerEmail: '',
      registerPassword: '',
      registerError: '',
      isRegistering: false,

      loginEmail: '',
      loginPassword: '',
      loginError: '',
      isLoggingIn: false,

      isLoggedIn: !!localStorage.getItem('token'),
      currentUserEmail: localStorage.getItem('userEmail') || '',

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
      showFinishModal: false,
      goalToFinish: null,  
      showDeleteModal: false,
      goalsToDelete: [],
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
  if (this.isLoggedIn) {
    this.fetchGoals();
  }
},

  methods:{
    logout() {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');

      this.isLoggedIn = false;
      this.currentUserEmail = '';

      this.goals = [];
      this.completedGoals = [];
    },
    async login() {
      this.loginError = '';
      this.isLoggingIn = true;

      try {
        const response = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: this.loginEmail,
            password: this.loginPassword
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message);
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('userEmail', this.loginEmail);

        this.isLoggedIn = true;
        this.currentUserEmail = this.loginEmail;

        await this.fetchGoals();

        this.loginEmail = '';
        this.loginPassword = '';

        alert('Login successful!');

      } catch (error) {
        this.loginError = error.message;
      } finally {
        this.isLoggingIn = false;
      }
    },

    async register() {
  this.registerError = '';
  this.isRegistering = true;

  try {
    const response = await fetch(`${API_URL}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: this.registerEmail,
        password: this.registerPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message);
    }

    alert('Account created successfully!');

    this.registerEmail = '';
    this.registerPassword = '';

  } catch (error) {
    this.registerError = error.message;
  } finally {
    this.isRegistering = false;
  }
},

    async fetchGoals() {
  try {
    const response = await fetch(`${API_URL}/api/goals`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });

  if (response.status === 401 || response.status === 403) {
      this.logout();
      return;
    }

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
      this.goalToFinish = goal;
      this.showFinishModal = true;
    },
     finishGoal() {
      if (this.goalToFinish) {
        this.removeGoal(this.goalToFinish);
      }

      this.showFinishModal = false;
      this.goalToFinish = null;
    },

    cancelFinish() {
      this.showFinishModal = false;
      this.goalToFinish = null;
    },
async deleteSelectedGoals() {
  const selectedGoals = this.completedGoals.filter(
    goal => goal.selected
  );

  if (selectedGoals.length === 0) {
    return;
  }

  this.goalsToDelete = selectedGoals;
  this.showDeleteModal = true;
},
async confirmDeleteSelectedGoals() {
  this.isDeletingGoals = true;

  try {
    for (const goal of this.goalsToDelete) {
      const response = await fetch(`${API_URL}/api/goals/${goal.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error(
          `Failed to delete goal ${goal.id}`
        );
      }
    }

    this.completedGoals = this.completedGoals.filter(
      goal => !goal.selected
    );

    this.showDeleteModal = false;
    this.goalsToDelete = [];
    this.isDeletingGoals = false;

  } catch (error) {
    console.error(error);

    this.errorMessage =
      'Could not delete one or more goals. Please try again.';

    this.isDeletingGoals = false;
  }
},
cancelDeleteSelectedGoals() {
  this.showDeleteModal = false;
  this.goalsToDelete = [];
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

  // Allow Unknown duration (null or empty)
  if (
    goal.duration !== '' &&
    goal.duration !== null &&
    goal.duration !== undefined &&
    Number(goal.duration) < 1
  ) {
    this.editErrorMessage = 'Duration must be at least 1 day.';
    return;
  }

  let finishDate = null;

  // Only calculate a finish date if a duration was entered
  if (
    goal.duration !== '' &&
    goal.duration !== null &&
    goal.duration !== undefined
  ) {
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
      `${API_URL}/api/goals/${goal.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: goal.title,
          duration:
            goal.duration === '' ||
            goal.duration === null ||
            goal.duration === undefined
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
      `${API_URL}/api/goals`,
      {
        method: 'POST',
        headers: {
         'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
      `${API_URL}/api/goals/${goal.id}`,
      {
        method: 'PUT',
       headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
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
      if (!goal.finishDate) {
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
 