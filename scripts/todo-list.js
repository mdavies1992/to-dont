console.log('todo-list | Hello World!');

/**
 * A single ToDo in our list of Todos.
 * @typedef {Object} ToDo
 * @property {string} id - A unique ID to identify this todo.
 * @property {string} label - The text of the todo.
 * @property {boolean} isDone - Marks whether the todo is done.
 * @property {string} userId - The user who owns this todo.
 */

/* CLASS SETTINGS / STANDARD LANGUAGE */  
class ToDoList {
    static ID = 'todo-list';
    
    
    static FLAGS = {
      TODOS: 'todos'
    }
    
    static TEMPLATES = {
      TODOLIST: `modules/${this.ID}/templates/todo-list.hbs`
    }

    static initialize() {
      this.toDoListConfig = new ToDoListConfig();
    }

  }
  
  Hooks.once('init', () => {
    ToDoList.initialize();
  });

  class ToDoListData {
    static getToDosForUser(userId) {
      return game.users.get(userId)?.getFlag(ToDoList.ID, ToDoList.FLAGS.TODOS);
    }
    /* CRUD - CREATE */  
    static createToDo(userId, toDoData) {
      // generate a random id for this new ToDo and populate the userId
      const newToDo = {
        isDone: false,
        ...toDoData,
        id: foundry.utils.randomID(16),
        userId,
      }

      // construct the update to insert the new ToDo
      const newToDos = {
        [newToDo.id]: newToDo
      }
  
      // update the database with the new ToDos
      return game.users.get(userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, newToDos);
    }

    /* CRUD - READ */ 
    static get allToDos() {
      const allToDos = game.users.reduce((accumulator, user) => {
        const userTodos = this.getToDosForUser(user.id);
  
        return {
          ...accumulator,
          ...userTodos
        }
      }, {});
  
      return allToDos;
    }

    /* CRUD - UPDATE */ 
    static updateToDo(toDoId, updateData) {
      const relevantToDo = this.allToDos[toDoId];
  
      // construct the update to send
      const update = {
        [toDoId]: updateData
      }
  
      // update the database with the updated ToDo list
      return game.users.get(relevantToDo.userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, update);
    }

    /* CRUD - DELETE */ 
    static deleteToDo(toDoId) {
      const relevantToDo = this.allToDos[toDoId];
  
      // Foundry specific syntax required to delete a key from a persisted object in the database
      const keyDeletion = {
        [`-=${toDoId}`]: null
      }
  
      // update the database with the updated ToDo list
      return game.users.get(relevantToDo.userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, keyDeletion);
    }
    /* CRUD+ - UPDATE (ALL) */   
    static updateUserToDos(userId, updateData) {
      return game.users.get(userId)?.setFlag(ToDoList.ID, ToDoList.FLAGS.TODOS, updateData);
    }
  }

  Hooks.on('renderPlayerList', (playerList, html) => {
    // find the element which has our logged in user's id
    const loggedInUserListItem = html.find(`[data-user-id="${game.userId}"]`)
    
   // create localized tooltip
   const tooltip = game.i18n.localize('TODO-LIST.button-title');

   // insert a button at the end of this element
   loggedInUserListItem.append(
    `<button type='button' class='todo-list-icon-button flex0' title='${tooltip}'><i class='fas fa-tasks'></i></button>`
  );

  
  html.on('click', '.todo-list-icon-button', (event) => {
    console.log(true, 'Button Clicked!');
    const userId = $(event.currentTarget).parents('[data-user-id]')?.data()?.userId;
    ToDoList.toDoListConfig.render(true, {userId});
  });

  });

class ToDoListConfig extends FormApplication {
  static get defaultOptions() {
    const defaults = super.defaultOptions;
  
    const overrides = {
      closeOnSubmit: false,
      height: 'auto',
      id: 'todo-list',
      submitOnChange: true,
      template: ToDoList.TEMPLATES.TODOLIST,
      title: 'To Do List',
      userId: game.userId,
    };
  
    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);
    
    return mergedOptions;
  }

  getData(options) {
    return {
      todos: ToDoListData.getToDosForUser(options.userId)
    }
  }

  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);

    await ToDoListData.updateUserToDos(this.options.userId, expandedData);

    this.render();
  }
};