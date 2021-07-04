const fastify = require('fastify')()

fastify.register(require('fastify-mongodb'), {
  // force to close the mongodb connection when app stopped
  // the default value is false
  forceClose: true,
  url: 'mongodb://localhost:27030/isayalejo'
})

fastify.get('/initdata', async function (req, reply) {
    // Or this.mongo.client.db('mydb')
    const db = this.mongo.db

    const initialData = require('./initialdata.json');

    const coll = await db.collection('guests');
    // console.log('initialData[0]::: ', initialData[0]);
    // await coll.insertOne(initialData[0])
    console.log('initialData.length::: ', initialData.length);

    for (let $i = 0; $i < initialData.length; $i++) {
        const data = initialData[$i];
        await coll.insertOne(data)
        
    }

    reply.send({
        status: 'Finished'
    })

    //console.log('coll::: ', coll);
  
/*     function onCollection (err, col) {
      if (err) return reply.send(err)
  
      col.findOne({ id: req.params.id }, (err, user) => {
        reply.send(user)
      })
    } */
  })

/* fastify.get('/guests', function (req, reply) {
  // Or this.mongo.client.db('mydb')
  const db = this.mongo.db
  db.collection('quests', onCollection)

  function onCollection (err, col) {
    if (err) return reply.send(err)

    col.findOne({ id: req.params.id }, (err, user) => {
      reply.send(user)
    })
  }
}) */

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


fastify.listen(3000, err => {
  if (err) throw err
})