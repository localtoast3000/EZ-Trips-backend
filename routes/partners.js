import express from "express";
import bcrypt from "bcrypt";
import uid2 from "uid2";
import { validateReqBody, validateEmail } from "../lib/helpers.js";
import Partner from "../db/models/Partner.js";
import Trip from "../db/models/Trip.js";
const router = express.Router();

//*ROUTE ADD A PARTNER

router.post("/", async (req, res) => {
  if (
    validateReqBody({
      body: req.body,
      expectedPropertys: ["name", "email", "password", "address", "country"],
    }) &&
    validateEmail(req.body.email)
  ) {
    const { name, email, password, address, country } = req.body;
    if (await Partner.findOne({ name }))
      return res.json({ result: false, error: "Partner already exists" }); //* si le partner existe déjà la route s'arrête là
    new Partner({
      token: uid2(35),
      name,
      email,
      password: bcrypt.hashSync(password, 10),
      address,
      country,
      inscriptionDate: new Date(), //* ici new Date, donc pas besoin de créer un champ pour que les partners rentrent eux même leur date d'inscription
    })
      .save()
      .then((data) => {
        res.json({ result: true, newPartner: data }); //* affiche la fiche du nouveau partenaire
      });
  } else {
    res.json({ result: false, error: "Invalid partner data" }); //*les champs ne sont pas tous remplis 
  }
});

//* DELETE A PARTNER

//* ADD A TRIP

router.post("/trips", async (req, res) => {
  //! probleme dans la route trips validation failed: travelPeriod: Cast to Embedded failed for value "[ { start: '1', end: '12' } ]" (type Array) at path "travelPeriod" because of "ObjectExpectedError"

  if (
    validateReqBody({
      body: req.body,
      expectedPropertys: [
        "name", "country", "partnerID", "addressDeparture","minDurationDay",
        "maxDurationDay","start","end","description","included","nonIncluded","tags",
      ],
    })
  ) {
    const {
      name,country,partnerID,addressDeparture,minDurationDay,maxDurationDay,start,end,description,included,
      nonIncluded,
      tags,
    } = req.body;
    if (await Trip.findOne({ name }))
      return res.json({ result: false, error: "Trip name already exists" }); // fonctionne
    new Trip({
      name,
      country,
      partnerID, //* clé étrangère, string de l'ID
      addressDeparture,
      minDurationDay,
      maxDurationDay,
      travelPeriod: [{ start, end }], //* le front envoie un tableau d'objets
      description,
      included, //* le front envoie un tableau de strings
      nonIncluded, //* le front envoie un tableau de strings
      tags, //* le front envoie un tableau de strings
    })
      .save()
      .then((data) => {
        res.json({ result: true, newTrip: data }); //fonctionne
      });
  } else {
    res.json({ result: false, error: "Invalid trip data" }); //fonctionne
  }
});

//* add program

router.put("/program", (req, res) => {
  //! probleme dans la route trips validation failed: travelPeriod: Cast to Embedded failed for value "[ { start: '1', end: '12' } ]" (type Array) at path "travelPeriod" because of "ObjectExpectedError"

  if (
    validateReqBody({
      body: req.body,
      expectedPropertys: ["tripID", "nbDay", "price"],
    }) //* on vérifie que tous les champs sont bien remplis
  ) {
    console.log('ici')
    const { tripID, nbDay, price } = req.body;
    Trip.findById(tripID).then((data) => {
      console.log('là')
      if (data) {
        //* si l'ID du trip existe alors on continue dans le code
        if (data.program) {
          console.log('oui')
          //* s'il y a déjà une key program alors on la remplie
          data.program.push({ nbDay: nbDay, price: price });
          data.save();
          res.json({ result: true, updatedTrip: data });
        } else { 
          console.log('coucou')
          //* si il n'y a pas encore de program dans la fiche du trip alors on la crée
          data["program"] = { nbDay: nbDay, price: price };
          data.save()
          res.json({ result: true, updatedTrip: data }); //* on récupère à l'aide du trip ID le trip qu'on vient d'updater
        }
      } else {
        console.log('non')
        return res.json({ result: false, error: "Trip doesnt exist" }); //* si l'ID du trip n'est pas dans la database
      }
    });
  } else {
    console.log('hehe')
    res.json({ result: false, error: "A field is missing" }); ///* si les champs sont mal remplis
  }
});

//* add detailed program 
//! probleme dans la route trips validation failed: travelPeriod: Cast to Embedded failed for value "[ { start: '1', end: '12' } ]" (type Array) at path "travelPeriod" because of "ObjectExpectedError"
router.put("/detailedProgram", (req, res) => {
  if (
    validateReqBody({
      body: req.body,
      expectedPropertys: ["tripID", "day", "activities"],
    }) //* on vérifie que tous les champs sont bien remplis
  ) {
    const { tripID, day, activities } = req.body;
    console.log("condition");
    Trip.findById(tripID).then((data) => {
      if (data) {
        //* si l'ID du trip existe alors on continue dans le code
        if (data.program.detailedProgram) {
          data.program.detailedProgram.push({ day: day, activities: activities });
          data.save();
          res.json({ result: true, updatedTrip: data });
        } else {
          data["program"]['detailedProgram'] = {day: day, activities: activities };
          data.save()
          res.json({ result: true, updatedTrip: data }); //* on récupère à l'aide du trip ID le trip qu'on vient d'updater
        }
      } else {
        return res.json({ result: false, error: "Trip doesnt exist" }); //* si
      }
    });
  } else {
    res.json({ result: false, error: "A field is missing" }); ///* si les champs sont mal remplis
  }
});

//* add photos + background






export default router;
