const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
const dbPath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())
let db = null
const initializeDbServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Successs')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDbServer()
const hasPriorityAndStatusProperty = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND status = '${status}'
                    AND priority = '${priority}'; `
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM 
                    todo
                WHERE
                    todo LIKE '%${search_q}%'
                    AND priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE '%${search_q}%'
                    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
                SELECT 
                    *
                FROM
                    todo
                WHERE 
                    todo LIKE '%${search_q}%';   
            `
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodosQuery = `
        SELECT 
            *
        FROM 
            todo 
        WHERE
            id = ${todoId};
    `
  const result = await db.get(getTodosQuery)
  response.send(result)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const getTodosQuery = `
        INSERT INTO 
            todo (id, todo, priority, status)
        VALUES (
            ${id},
            '${todo}',
            '${priority}',
            '${status}'
        );
    `
  const result = await db.run(getTodosQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const requestBody = request.body
  let updateColumn = ''

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const prevTodoQuery = `
        SELECT
            *
        FROM
            todo 
        WHERE 
            id = ${todoId};
    `
  const prevTodo = await db.get(prevTodoQuery)

  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
  } = request.body

  const updateQuery = `
        UPDATE 
            todo
        SET 
            todo='${todo}',
            priority = '${priority}',
            status = '${status}'
        WHERE 
            id = ${todoId};
    `
  const result = await db.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getQuery = `
        DELETE FROM 
            todo 
        WHERE 
            id = ${todoId};
    `
  const result = await db.run(getQuery)
  response.send('Todo Deleted')
})
export default app
