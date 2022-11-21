import express, { Router } from 'express';
import bcrypt from 'bcrypt';
import uid2 from 'uid2';
import { checkBody } from '../lib/helpers.js';
import Partner from '../db/models/Partner.js';
import Trip from '../db/models/Trip.js';
import Order from '../db/models/Order.js';
import User from '../db/models/User.js';

const router = express.Router();

//! status : 'Requested' - 'Received' - 'Validated'

//* ---------------------- ADD AN ORDER -----------------------

router.post('/', async (req, res) => {
  if (
    checkBody(req.body, [
      'user',
      'trip',
      'nbDays',
      'nbTravelers',
      'start',
      'end',
      'totalPrice',
    ])
  ) {
    const { user, trip, nbDays, nbTravelers, start, end, comments, totalPrice } =
      req.body;
    User.findOne({ token: user }).then((data) => {
      if (data) {
        new Order({
          user: data.id,
          trip,
          start,
          end,
          bookingDate: new Date(),
          nbDays,
          nbTravelers,
          comments,
          totalPrice,
          status: 'Requested', //
        })
          .save()
          .then((data) => {
            if (data) {
              res.json({ result: true, newOrder: data });
            } else {
              res.json({ result: false, error: 'new Order failed' });
            }
          });
      } else {
        res.json({ result: false, error: 'user not found' });
      }
    });
  } else {
    res.json({ result: false, error: 'Invalid data input' });
  }
});

//* -------------- GET ALL THE ORDER OF A GIVEN USER --------------

router.get('/:token', (req, res) => {
  const { token } = req.params;
  User.findOne({ token: token }).then((dataUser) => {
    if (dataUser) {
      Order.find({ user: dataUser._id })
        .populate('trip')
        .then((orderResult) => {
          if (orderResult) {
            res.json({ result: true, data: orderResult });
          } else {
            res.json({ result: true, data: 'Not order in BDD' });
          }
        });
    }
  });
});

//* -------------- GET AN ORDER TO DISPLAY  --------------

// get an order by its ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  Order.findById({ _id: id })
    .populate('trip')
    .then((data) => {
      if (data) {
        res.json({ result: true, data: data });
      } else {
        res.json({ result: false, error: 'User not found' });
      }
    });
});

//* ------------ UPDATE LE STATUS -----------------  requested -> received -> validated

router.put('/updateStatus/:orderID', async (req, res) => {
  const { orderID } = req.params;
  if (await !Order.findById({ orderID }))
    return res.json({ result: false, error: 'Order doesnt exist' });
  Order.updateOne({ _id: orderID }, [
    // * -------------------- si le statut est requested alors ça passe en received et s'il est received ça passe en validated --------------
    {
      $set: {
        status: {
          $switch: {
            branches: [
              { case: { $eq: ['$status', 'Requested'] }, then: 'Received' },
              { case: { $eq: ['$status', 'Received'] }, then: 'Validated' },
            ],
          },
        },
      },
    },
  ]).then(() => {
    Order.findOne({ _id: orderID }).then((data) => {
      res.json({ result: true, status: data.status });
    });
  });
});

export default router;
