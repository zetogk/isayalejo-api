/* fastify.listen(process.env.PORT, err => {
  if (err) {
    throw err
  } else {
    console.log('Running in the port ', process.env.PORT)
  }
})
 */
const start = async () => {
    try {
  
      const fastify = require('fastify')({ logger: true });
  
      const port = process.env.PORT;
  
      console.log('process.env.MONGOURI::: ', process.env.MONGOURI);
      console.log('process.env.PORT::: ', process.env.PORT);
  
      fastify.register(require('fastify-mongodb'), {
          // force to close the mongodb connection when app stopped
          // the default value is false
          forceClose: true,
          //url: 'mongodb://localhost:27030/isayalejo'
          url: process.env.MONGOURI
      })
      
      fastify.get('/health', async function (req, reply) {
      
          reply.send({
              data: {
              date: Date.now(),
              },
              status: 'ok',
              message: 'API working'
          })
          
      });
  
      fastify.get('/initdata', async function (req, reply) {
          const db = this.mongo.db
          const initialData = require('./initialdata.json');
          const coll = await db.collection('guests');
          console.log('initialData.length::: ', initialData.length);
      
          for (let $i = 0; $i < initialData.length; $i++) {
              const data = initialData[$i];
              await coll.insertOne(data)
          }
      
          reply.send({
              status: 'Finished'
          })
      
      })
      
      fastify.get('/guests', async function (req, reply) {
  
          try {
      
              const db = this.mongo.db
              const coll = await db.collection('guests')
              const guests = await coll.find({}).toArray();
          
              console.log('guests: ', guests);
          
              reply.send({
              data: guests,
              status: 'ok',
              message: ''
              });
          
          } catch (err) {
      
              console.error('Error /guests: ', err);
          
              reply.send({
              data: null,
              status: 'error',
              message: err.message
              });
          
          }
      
      })
  
      fastify.put('/guests/:slug/confirmation', async function (req, reply) {
  
          const { slug } = req.params;
      
          const db = this.mongo.db
          const coll = await db.collection('guests');
  
          try {
      
              const invitation = await coll.findOne({ slug });
              invitation.status = 'confirmado';
              await coll.updateOne({ slug }, {$set: {
                  status: 'confirmado'
              }});
      
              reply.send({
                  data: invitation,
                  status: 'ok',
                  message: ''
              })
              
          } catch (err) {
  
              console.error('Error updating guest: ', err);
  
              reply.send({
                  data: null,
                  status: 'error',
                  message: err.message
              })
              
          }
      
      });
  
      fastify.get('/guests/:slug', async function (req, reply) {
  
          const { slug } = req.params;
      
          const db = this.mongo.db
          const coll = await db.collection('guests');
      
          try {
      
              const guest = await coll.findOne({ slug });
      
              if (guest == null) {
      
                  reply.send({ 
                      data: null,
                      status: 'error',
                      message: 'Not found'
                  });
  
              }
              reply.send({
                  data: guest,
                  status: 'ok',
                  message: ''
              })
              
          } catch (err) {
      
              console.error('Error updating guest: ', err);
      
              reply.send({
                  data: null,
                  status: 'error',
                  message: err.message
              })
              
          }
      
      })
  
      await fastify.listen(port|| 3000)
      fastify.log.info(`server listening on ${fastify.server.address().port}`)
    } catch (err) {
      fastify.log.error(err)
      process.exit(1)
    }
  }
  start()