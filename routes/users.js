import express from 'express';
import bcrypt from 'bcrypt';
import uid2 from 'uid2';
import { validateReqBody } from '../lib/helpers.js';
import { checkBody } from '../lib/helpers.js';
import User from '../db/models/User.js';
const router = express.Router();
import cloudinary from 'cloudinary';
import fs from 'fs';
import uniqid from 'uniqid';

/////////////////////////////////////////////////////////////////////CREATE, HANDLE & DELETE USER INFOS///////////////////////////////////////////////////////

//SIGN-UP ROUTE

router.post('/signup', (req, res) => {
  console.log(req.body);
  if (!checkBody(req.body, ['firstName', 'lastName', 'password', 'email'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has not already been registered via son email
  User.findOne({ email: req.body.email }).then((data) => {
    //Si on ne trouve rien, l'utilisateur n'est pas déjà enregistré. On peut créer un nouvel User.
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);
      const date = Date.now();
      const newUser = new User({
        token: uid2(32),
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: hash,
        inscriptionDate: date,
        email: req.body.email,
        address: req.body.address ? req.body.address : null,
        tags: req.body.tags ? req.body.tags : null,
        country: req.body.country ? req.body.country : null,
        birthDate: req.body.birthDate ? req.body.birthDate : null,
        sexe: req.body.sexe ? req.body.sexe : null,
        likes: [],
        booked: [],
        document: [],
      });

      //renvoyer le token vers le front pour le store dans le reducer
      newUser.save().then((data) => {
        res.json({
          result: true,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token: data.token,
        });
      });
    } else {
      // L'email fourni est déjà en database : le user est déjà inscrit
      res.json({ result: false, error: 'Cet email existe déjà' });
    }
  });
});

///////SIGN-IN ROUTE

router.post('/signin', (req, res) => {
  if (!validateReqBody({ body: req.body, expectedPropertys: ['email', 'password'] })) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  User.findOne({ email: req.body.email }).then((data) => {
    if (data) {
      if (bcrypt.compareSync(req.body.password, data.password)) {
        res.json({
          result: true,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          token: data.token,
        });
      }
      //si le bcrypt.password ne match pas le password fourni, renvoi une erreur
      else {
        res.json({ result: false, error: 'Wrong password' });
      }
    }
    //si le findOne avec l'email n'a rien renvoyé, l'email n'est pas en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

/////////GET USER INFOS

router.get('/:token', (req, res) => {
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!req.params.token) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      const { firstName, lastName, inscriptionDate, email, address, country, preference } = data;
      //renvoi tous les objets contenus dans tripsLiked
      res.json({ result: true, user: { firstName, lastName, inscriptionDate, email, address, country, preference } });
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

//////UPDATE USER INFOS

router.put('/:token/update', (req, res) => {
  if (!req.params.token) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      const newInfo = req.body.info;
      const toUpdate = req.body.field;
      console.log(newInfo, toUpdate);
      const update = {};
      update[toUpdate] = newInfo;
      // change la donnée indiquée en params sur l'utilisateur identifié par son token
      User.updateOne({ _id: data.id }, { $set: update }).then(res.json({ result: true, userModified: data }));
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

///////DELETE USER PROFILE

router.delete('/', (req, res) => {
  // Si le token n'est pas reçu, il y a une erreur du côté de l'envoi du front.
  if (!req.body.token) {
    res.json({ result: false, error: 'Faulty front-end info' });
  }

  User.deleteOne({ token: req.body.token }).then(() => {
    res.json({ result: true });
  });
});

/////////////////////////////////////////////////////////////////LIKES/////////////////////////////////////////////////////////////////

/////LIKE ROUTES REQ.BODY = token, tripID

router.post('/like', (req, res) => {
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!validateReqBody({ body: req.body, expectedPropertys: ['token', 'tripID'] })) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  //Trouve le bon User à qui rajouter le trip liké, via le token renvoyé par le front
  User.findOne({ token: req.body.token }).then((data) => {
    console.log(req.body.tripID);
    if (data) {
      if (data.tripsLiked.some((e) => e === req.body.tripID)) {
        res.json({ result: false, error: 'Trip déjà liké en BDD' });
      } else {
        data.tripsLiked.push(req.body.tripID);
        data.save();
        res.json({ result: true, user: data });
      }
      //push l'ID du trip liked dans la BDD
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

////GET THE TRIPS /!\WITH DETAILS/!\ LIKED BY USER

router.get('/like/:token', (req, res) => {
  console.log(req.params);
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!req.params.token) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.params.token })
    .populate('tripsLiked')
    .then((data) => {
      if (data) {
        //renvoi tous les objets contenus dans tripsLiked
        res.json({ result: true, tripsLiked: data.tripsLiked });
      }
      //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
      else {
        res.json({ result: false, error: 'User not found' });
      }
    });
});

////GET /!\JUST THE IDs OF THE TRIPS LIKED BY USER

router.get('/idLike/:token', (req, res) => {
  console.log(req.params);
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!req.params.token) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.params.token }).then((data) => {
    if (data) {
      //renvoi tous les objets contenus dans tripsLiked
      res.json({ result: true, tripsLiked: data.tripsLiked });
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

////DELETE A TRIP FROM THE LIKES REQ.BODY = token, tripID

router.delete('/like', async (req, res) => {
  console.log('req.body', req.body);
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!checkBody(req.body, ['token'])) {
    console.log('ata');
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  await User.updateOne({ token: req.body.token }, { $pull: { tripsLiked: req.body.tripID } });

  res.json({ result: true });
  // User.findOne({token: req.body.token}).then((data) => {
  //   data.tripsLiked.pull(req.body.tripID);
  //   data.save();
  // }).then(res.json({result: true}))
});

//////////////////////////////////////////////////////////// DOCUMENTS ///////////////////////////////////////////////////////////////////////////

/////AJOUTER UN DOCUMENT A SON ESPACE : REQ.BODY = token, formData
router.post('/upload', async (req, res) => {
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas sauvegarder de trips.
  if (!checkBody(req.body, ['token'])) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  const docPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(docPath);
  //if resultMove renvoie undefined, l'opération a fonctionné
  if (!resultMove) {
    const resultCloudinary = await cloudinary.uploader.upload(docPath);

    //Trouve le bon User à qui rajouter le document, via le token renvoyé par le front
    User.findOne({ token: req.body.token }).then((data) => {
      if (data) {
        //push l'URL du document qui vient d'être uploadé sur Cloudinary
        data.documents.push(resultCloudinary.secure_url);
        res.json({ result: true, documentSaved: resultCloudinary.secure_url });
      }
      //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
      else {
        res.json({ result: false, error: 'User not found' });
      }
    });
  }

  //if the resultMove didn't work:
  else {
    res.json({ result: false, error: resultCopy });
  }
  // delete the temporary copy
  fs.unlinkSync(photoPath);
});

//////GET THE DOCUMENTS BY USER

router.get('/docs/:token', (req, res) => {
  // Si le token n'est pas reçu, le User n'est pas connecté et ne peut donc pas avoir de documents à afficher.
  if (!req.params) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.body.token }).then((data) => {
    if (data) {
      //renvoi un array d'URL à afficher dans le front
      res.json({ result: true, documents: data.documents });
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

//////DELETE A DOCUMENT. REQ.BODY : token, url

router.delete('/docs', (req, res) => {
  // Si le token n'est pas reçu dans le body, le User n'est pas connecté
  if (!req.body.token) {
    res.json({ result: false, error: 'User not connected' });
    return;
  }

  User.findOne({ token: req.body.token }).then((data) => {
    if (data) {
      User.documents.pull(req.body.url);
      res.json({ result: true, documents: data.documents });
    }
    //si le token n'est pas reconnu, le user n'est pas enregistré en BDD.
    else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});

export default router;
