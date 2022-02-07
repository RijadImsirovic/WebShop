var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const { Pool, Client } = require('pg');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
var ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const path = require('path')
const multer = require('multer');
const date = require('date-and-time');
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'webshopbot@gmail.com',
    pass: 'sifra12345'
  }
});

var mailOptions = {
  from: 'webshopbot@gmail.com',
  to: 'rijad.imsirovic@yahoo.com',
  subject: 'Transaction Details',
  text: 'Your transaction was completed.'
};



const pool = new Pool({
  user: 'audiluts',
  host: 'abul.db.elephantsql.com',
  database: 'audiluts',
  password: 'NaHGAkv3xfn32qJjI6h1WW7_4Strhw3m',
  port: 5432,
  max: 10,
  idleTimeoutMillis: 30000,
});

var storage = multer.diskStorage({
  destination: function (req, file, cb) {

    // Uploads is the Upload_folder_name
    cb(null, "uploads")
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now()+".jpg")
  }
})


const maxSize = 1 * 1000 * 1000;

var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function (req, file, cb){

    // Set the filetypes, it is optional
    var filetypes = /jpeg|jpg|png/;
    var mimetype = filetypes.test(file.mimetype);

    var extname = filetypes.test(path.extname(
        file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }

    cb("Error: File upload only supports the "
        + "following filetypes - " + filetypes);
  }

// mypic is the name of file attribute
});



passport.use('local-admin',new LocalStrategy((username, password, done) => {

  pool.query(`select * from korisnik_admin where username = $1`,[username] ,(err, result) => {

    if (err) {
      console.info(err);
      return done(err);
    } else {
      if (result.rows.length === 0){

        return done(null,false);
      } else {
        let kriptoPass = result.rows[0].password;
        if (bcrypt.compareSync(password, kriptoPass)){

          return done(null, result.rows[0]);
          //[{username: result.rows[0].username,ime: result.rows[0].ime_korisnika, prezime: result.rows[0].prezime_korisnika,email: result.rows[0].email, tip: result.rows[0].tip_korisnika}]);
          // [{username: res.korisnik.username,ime: res.korisnik.ime, prezime: res.korisnik.prezime,email: res.korisnik.email,}]
          // [{email: result.rows[0].email, firstName: result.rows[0].firstName}]
        } else {
          console.log("Loša šifra!");

          return done(null,false,{ message: 'Incorrect username or password.' });
        }

      }

    }

  });


}))

passport.use('local-kupci',new LocalStrategy((username, password, done) => {

  pool.query(`select * from korisnici_kupci where username = $1`,[username] ,(err, result) => {


    if (result.rows.length === 0){
      return done(null,false);
    }

    if(result.rows[0].block_period === null){
    if (err) {
      console.info(err);
      return done(err);
    } else {
      if (result.rows.length === 0){

        return done(null,false);
      } else {
        let kriptoPass = result.rows[0].password;
        if (bcrypt.compareSync(password, kriptoPass)){

          return done(null, result.rows[0]);

        } else {
          console.log("Loša šifra!");

          return done(null,false,{ message: 'Incorrect username or password.' });
        }

      }

    }
    }else{
      return done(null,false);
    }

  });


}))

passport.use('local-trgovci',new LocalStrategy((username, password, done) => {



  pool.query(`select * from korisnici_trgovci where naziv_trgovine = $1`,[username] ,(err, result) => {


      if (err) {
        console.info(err);
        return done(err);
      } else {
        if (result.rows.length === 0) {

          return done(null, false);
        } else {
          let kriptoPass = result.rows[0].password;
          if (bcrypt.compareSync(password, kriptoPass)) {

            return done(null, result.rows[0]);
            //[{username: result.rows[0].username,ime: result.rows[0].ime_korisnika, prezime: result.rows[0].prezime_korisnika,email: result.rows[0].email, tip: result.rows[0].tip_korisnika}]);
            // [{username: res.korisnik.username,ime: res.korisnik.ime, prezime: res.korisnik.prezime,email: res.korisnik.email,}]
            // [{email: result.rows[0].email, firstName: result.rows[0].firstName}]
          } else {
            console.log("Loša šifra!");

            return done(null, false, {message: 'Incorrect username or password.'});
          }

        }

      }

  });


}))



passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.info(user);

  if (user.tip_korisnika == 1){
    pool.query(`select * from korisnik_admin where username = $1`,[user.username] ,(err, result) => {
      if(err){
        console.info(err);
        return done(null,err);
      }
      done(null,result.rows[0]);
    });
  } else if (user.tip_korisnika == 2){
    pool.query(`select * from korisnici_kupci where username = $1`,[user.username] ,(err, result) => {
      if(err){
        console.info(err);
        return done(null,err);
      }
      done(null,result.rows[0]);
    });

  } else if (user.tip_korisnika == 3){
    pool.query(`select * from korisnici_trgovci where naziv_trgovine = $1`,[user.naziv_trgovine] ,(err, result) => {
      if(err){
        console.info(err);
        return done(null,err);
      }
      done(null,result.rows[0]);
    });
  }






});

var db = {
  registrujKorisnika: function (req, res, next) {
    var korisnik = {
      ime: req.body.firstName,
      prezime: req.body.lastName,
      email: req.body.email,
      username: req.body.username,
      password: req.body.password,
      odabKateg: req.body.odabraneKategorije
    };

    var interesi = "{";
    for(let i = 0; i< req.body.odabraneKategorije.length; i++){
      interesi += req.body.odabraneKategorije[i];
      if(i !== req.body.odabraneKategorije.length-1){
        interesi += ",";
      }
    }

    interesi += "}";

    const hashPass = bcrypt.hashSync(korisnik.password, 10);

    pool.query(`insert into korisnici_kupci (ime_korisnika,prezime_korisnika,username,password,email,tip_korisnika,interesovanja) values ($1,$2,$3,$4,$5,$6,$7)`, [korisnik.ime, korisnik.prezime, korisnik.username, hashPass, korisnik.email, 2, interesi], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  getKupci: function (req, res, next) {

    pool.query(`select * from korisnici_kupci`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.korisnici_kupci = result.rows;
      next();
    });
  },
  registrujTrgovca: function (req, res, next) {
    var trgovac = {
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
      adress: req.body.adress,
      city: req.body.city,
      izbor: req.body.izbor,
      slika: 'http://localhost:3000/uploads/' + req.file.filename,
    };

    const hashPass = bcrypt.hashSync(trgovac.password, 10);

    pool.query(`insert into korisnici_trgovci (naziv_trgovine,email,password,kontakt_telefon,adresa,mjesto,tip_korisnika,id_kategorije,slika_profila) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [trgovac.username, trgovac.email, hashPass, trgovac.phoneNumber, trgovac.adress, trgovac.city, 3, trgovac.izbor,trgovac.slika], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  getKategorije: function (req, res, next) {

    pool.query(`select * from kategorije`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.kategorije = result.rows;
      next();
    });
  },
  dodajArtikal: function (req, res, next) {

    var artikal = {
      naziv_artikla: req.body.articleName,
      cijena: req.body.price,
      slika: 'http://localhost:3000/uploads/' + req.file.filename,
      radnja: req.user.id,
      kategorija: req.body.kategArt,
      stanje: req.body.stanjeArt,
      kolicina: req.body.kolicina,
      detaljne_informacije: req.body.detaljneInf

    };

    var now = new Date();
    date.format(now, 'YYYY/MM/DD HH:mm:ss');

    pool.query(`insert into artikli (naziv_artikla,cijena,slika_artikla,id_radnje,id_kategorije,stanje,kolicina,datum_objave,detaljne_informacije) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [artikal.naziv_artikla, req.body.price, artikal.slika, req.user.id, artikal.kategorija,artikal.stanje,artikal.kolicina,now,artikal.detaljne_informacije], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  getArtikal: function (req, res, next) {

    pool.query(`select * from artikli`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.artikli = result.rows;
      next();
    });
  },
  getSingleArtikal: function (req, res, next) {

    pool.query(`select * from artikli where id_artikla = $1`,[req.params.id], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.artikli = result.rows;
      next();
    });
  },
  getTrgovci: function (req, res, next) {

    pool.query(`select * from korisnici_trgovci`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.korisnici_trgovci = result.rows;
      console.info()
      next();
    });
  },
  updateTrgovac: function (req, res, next) {
    var noviTrgovac = {
      username: req.body.userNovi,
      email: req.body.emailNovi,
      password: req.body.passwordNovi,
      phoneNumber: req.body.phoneNumberNovi,
      adress: req.body.adressNovi,
      city: req.body.cityNovi,
      izbor: req.body.izborNovi,
      slika: 'http://localhost:3000/uploads/' + req.file.filename,
    };

    const noviPass = bcrypt.hashSync(noviTrgovac.password, 10);

    pool.query(`update korisnici_trgovci set naziv_trgovine = $1, email = $2, password = $3, kontakt_telefon = $4, adresa = $5, mjesto = $6,id_kategorije = $7,slika_profila= $8  where id = $9`,[noviTrgovac.username, noviTrgovac.email, noviPass, noviTrgovac.phoneNumber, noviTrgovac.adress, noviTrgovac.city, noviTrgovac.izbor,noviTrgovac.slika,req.user.id], (err, result) => {



        next();
    });
  },
  deleteArtikal: function (req, res, next) {

    pool.query(`delete from artikli where id_artikla= $1`,[req.params.kod], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }


      next();
    });
  },
  updateArtikal: function (req, res, next) {
    var noviArtikal = {
      naziv_artikla: req.params.naziv,
      cijena: req.params.cijena,
      kategorija: req.params.kategorija,
      stanje: req.params.stanje,
      kolicina: req.params.kolicina,
      detaljne_informacije: req.params.detaljno
    };

    pool.query(`update artikli set naziv_artikla = $1, cijena = $2, id_kategorije = $3, stanje = $4, kolicina = $5, detaljne_informacije = $6 where id_artikla = $7`,[noviArtikal.naziv_artikla,noviArtikal.cijena,noviArtikal.kategorija,noviArtikal.stanje,noviArtikal.kolicina,noviArtikal.detaljne_informacije,req.params.idArt], (err, result) => {



      next();
    });
  },
  getNarudzbe: function (req, res, next) {

    pool.query(`select * from narudzbe`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.narudzbe = result.rows;
      next();
    });
  },
  ukupnaZarada: function (req, res, next) {
    pool.query(`select sum(cijena)*sum(kolicina) as mojePare from zaradaRadnje where id_radnje = $1 and isporuceno = $2`,[req.user.id,2], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }
      req.zaradaRadnje = result.rows;

      next();
    });
  },
  getRandomArtikal: function (req, res, next) {

    pool.query(`select * from dajRandom`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.dajRandom = result.rows;
      next();
    });
  },
  updateOcjena: function (req, res, next) {
    pool.query(`select * from unesi_ocjenu($1,$2)`,[req.params.idArtikla,req.params.rating], (err, result) => {



      next();
    });
  },
  getPopularniArtikal: function (req, res, next) {

    pool.query(`select * from popularni`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.popularni = result.rows;
      next();
    });
  },
  pretraziPoArtiklu: function (req, res, next) {
      pool.query(`select * from artikli where naziv_artikla ILIKE '%' || $1 || '%'`,[req.params.pom1], (err, result) => {

        if (err) {
          console.info(err);
          return next();
        }

        req.artikli = result.rows;
        next();
      });
  },
  pretraziPoTrgovcu: function (req, res, next) {
      pool.query(`select * from korisnici_trgovci where naziv_trgovine ILIKE '%' || $1 || '%'`,[req.params.pom1], (err, result) => {

        if (err) {
          console.info(err);
          return next();
        }

        req.korisnici_trgovci = result.rows;
        next();
      });
    },
  pretraziPoKategoriji: function (req, res, next) {
    pool.query(`select * from artikli inner join kategorije k on artikli.id_kategorije = k.id where k.naziv_kategorije ILIKE '%' || $1 || '%'`,[req.params.pom1], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.artikli = result.rows;
      next();
    });
  },
  dodajNarudzbu: function (req, res, next) {

    pool.query(`insert into narudzbe (id_kupca,id_trgovca,id_artikla,isporuceno,kolicina) values ($1,$2,$3,$4,$5)`, [req.user.id_korisnika, req.body.idTrgovca,req.body.idArtikla,1,req.body.kolicinaOVA], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  dodajUKorpu: function (req, res, next) {

    pool.query(`insert into korpa (id_kupca,id_artikla,kolicina,stanje,id_trgovca) values ($1,$2,$3,$4,$5)`, [req.user.id_korisnika, req.params.kodZaKorpe,req.params.kolicinaZaKorpe,1,req.params.kodZaTrg], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  getKorpa: function (req, res, next) {

    pool.query(`select * from korpa`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.korpa = result.rows;
      next();
    });
  },
  dodajNarudzbuDrug: function (req, res, next) {

    pool.query(`insert into narudzbe (id_kupca,id_trgovca,id_artikla,isporuceno,kolicina) values ($1,$2,$3,$4,$5)`, [req.user.id_korisnika, req.params.prva,req.params.druga,1,req.params.treca], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      } else {

        next();
      }

    });

  },
  obrisiIzKorpe: function (req, res, next) {

    pool.query(`delete from korpa where id_korpe= $1`,[req.params.sifraKorpe], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }


      next();
    });
  },
  obrisiNarudzbu: function (req, res, next) {
    pool.query(`delete from narudzbe where id_narudzbe= $1`,[req.body.narudzbaZaBrisanje], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }


      next();
    });
  },
  odobriNarudzbu: function (req, res, next) {
    pool.query(`update narudzbe set isporuceno = $1 where id_narudzbe= $2`,[2, req.body.isporucenaNarudzba], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });
      next();
    });

  },
  getSingleTrgovac: function (req, res, next) {

    pool.query(`select * from korisnici_trgovci where id = $1`,[req.params.idRad], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.korisnici_trgovci = result.rows;
      next();
    });
  },
  updateOcjenaTrgovca: function (req, res, next) {
    pool.query(`select * from unesi_ocjenu_trgovca($1,$2)`,[req.params.idTrgovca,req.params.rating], (err, result) => {



      next();
    });
  },
  sortArtikleA: function (req, res, next) {

    pool.query(`select * from sortA`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.sortA = result.rows;
      next();
    });
  },
  sortArtikleB: function (req, res, next) {

    pool.query(`select * from sortB`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.sortB = result.rows;
      next();
    });
  },
  sortArtikleC: function (req, res, next) {

    pool.query(`select * from sortC`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.sortC = result.rows;
      next();
    });
  },
  sortArtikleD: function (req, res, next) {

    pool.query(`select * from sortD`, (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      req.sortD = result.rows;
      next();
    });
  },
  blokiraj: function (req, res, next) {

    var datum= req.body.date + " " + req.body.time;
    pool.query(`update korisnici_kupci set block_period = $1 where id_korisnika = $2`,[datum,req.body.idKorisnika], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      next();
    });
  },
  odblokiraj: function (req, res, next) {
    pool.query(`update korisnici_kupci set block_period = NULL where id_korisnika = $1`,[req.body.idKorisnika1], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      next();
    });
  },
  blokirajTrg: function (req, res, next) {

    var datum= req.body.date + " " + req.body.time;
    pool.query(`update korisnici_trgovci set block_period = $1 where id = $2`,[datum,req.body.idTrgovca], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      next();
    });
  },
  odblokirajTrg: function (req, res, next) {
    pool.query(`update korisnici_trgovci set block_period = NULL where id = $1`,[req.body.idTrgovca1], (err, result) => {

      if (err) {
        console.info(err);
        return next();
      }

      next();
    });
  },
};



router.get('/narudzbe',ensureLoggedIn('/login'),db.ukupnaZarada,db.getArtikal,db.getNarudzbe,db.getKupci,function(req, res, next) {
console.log(req.zaradaRadnje[0]);
  res.render('trgovac-narudzbe', { artikal: req.artikli, trgovac: req.user, narudzbe: req.narudzbe, kupci: req.korisnici_kupci, zarada:req.zaradaRadnje});
});

router.get('/edit-artikal/:id',ensureLoggedIn('/login'),db.getSingleArtikal,db.getKategorije,function(req, res, next) {
  res.render('trgovac-urediArtikal', { artikal: req.artikli, trgovac: req.user, kategorije:req.kategorije});
});

router.get('/edit-katalog',ensureLoggedIn('/login'),db.getArtikal,function(req, res, next) {
  res.render('trgovac-urediKatalog', { artikal: req.artikli, trgovac: req.user});
});

router.get('/trgovac/profile/:idRad',db.getArtikal,db.getSingleTrgovac,db.sortArtikleA,db.sortArtikleB,db.sortArtikleC,db.sortArtikleD,ensureLoggedIn('/login'),function(req, res, next) {
  res.render('trgovac-profil', {artikal: req.artikli, trgovci: req.korisnici_trgovci, sortA: req.sortA, sortB: req.sortB, sortC: req.sortC, sortD: req.sortD});
});

router.get('/trgovac/profil',db.getArtikal,db.sortArtikleA,db.sortArtikleB,db.sortArtikleC,db.sortArtikleD,ensureLoggedIn('/login'),function(req, res, next) {
  res.render('trgovac-profil-private', {artikal: req.artikli, trgovac: req.user, sortA: req.sortA, sortB: req.sortB, sortC: req.sortC, sortD: req.sortD});
});

router.get('/edit-profile',db.getKategorije,function(req, res, next) {
  console.log(req.user);
  res.render('trgovac-urediProfil', { kategorije:req.kategorije,user:req.user });
});


router.get('/artikal/:id/',ensureLoggedIn('/login'), db.getSingleArtikal, function(req, res, next) {
  res.render('trgovac-pregled-artikla', { title: 'Artikal',trgovac: req.user,artikal: req.artikli  });
});



router.get('/artikal/:id/:idRad',ensureLoggedIn('/login'),db.getKategorije,db.getSingleTrgovac, db.getSingleArtikal, function(req, res, next) {
  console.info(req.korisnici_trgovci);
  console.info(req.artikli);
  res.render('artikal-trgovac', { title: 'Artikal',trgovci: req.korisnici_trgovci,artikal: req.artikli, kategorije:req.kategorije  });
});

router.get('/dodajArtikal',ensureLoggedIn('/login'), db.getKategorije,function(req, res, next) {
  res.render('trgovac-dodajArtikal', { title: req.user.username, kategorije:req.kategorije });
});

router.get('/slika/:naziv', function(req, res, next) {
  var radi = req.params.naziv;

  res.render('slikaTest', { title: radi });
});

router.get('/home-trgovac',ensureLoggedIn('/login'),db.getArtikal,function(req, res, next) {
    console.info(Date.now());
    console.info(req.user)
    res.render('trgovac-homepage', { artikal: req.artikli, trgovac: req.user});
});


router.get('/home-kupac',ensureLoggedIn('/login'),db.getArtikal,db.getRandomArtikal,db.getPopularniArtikal,db.getKategorije,function(req, res, next) {
  console.info(req.query);
  res.render('kupac-homepage', { artikal: req.artikli, kupac: req.user,random: req.dajRandom,popularni: req.popularni, kategorije: req.kategorije});
});


router.get('/pretraga/artikli/:pom1/:pom2',db.pretraziPoArtiklu,db.getKategorije,ensureLoggedIn('/login'),function(req, res, next) {
  res.render('kupac-pretraga-artikli', { artikal: req.artikli, kupac: req.user, kategorije: req.kategorije});
});

router.get('/pretraga/trgovci/:pom1/:pom2',db.pretraziPoTrgovcu,db.getKategorije,ensureLoggedIn('/login'),function(req, res, next) {
  res.render('kupac-pretraga-trgovci', { kupac: req.user , trgovci: req.korisnici_trgovci, kategorije: req.kategorije});
});

router.get('/pretraga/kategorije/:pom1/:pom2',db.pretraziPoKategoriji,db.getKategorije,ensureLoggedIn('/login'),function(req, res, next) {
  res.render('kupac-pretraga-kategorije', { artikal: req.artikli, kupac: req.user, kategorije: req.kategorije});
});

router.get('/mojaKorpa',ensureLoggedIn('/login'),db.getArtikal,db.getNarudzbe,db.getKorpa,function(req, res, next) {
  res.render('kupac-korpa', { artikal: req.artikli, kupac: req.user, narudzbe: req.narudzbe, korpa: req.korpa});
});



router.get('/home-admin',ensureLoggedIn('/login'), function(req, res, next) {
  res.render('admin-homepage', { title: req.user.username });
});

router.get('/users-list',ensureLoggedIn('/login'),db.getKupci,db.getTrgovci, function(req, res, next) {

  console.info(req.korisnici_kupci);
  res.render('admin-all-users', { kupci: req.korisnici_kupci,trgovci: req.korisnici_trgovci });
});

router.get('/statistika',ensureLoggedIn('/login'),db.getKupci,db.getTrgovci, function(req, res, next) {

  res.render('admin-statistika', { kupci: req.korisnici_kupci,trgovci:req.korisnici_trgovci });
});







router.get('/odaberiRegister', function(req, res, next) {
  res.render('odaberiRegister', { title: 'Express' });
});


/* GET home page. */
router.get('/', function(req, res, next) {
  if (req.isAuthenticated()){
    if(req.user.tip_korisnika == 1){
      return res.redirect('/home-admin');
    }else if(req.user.tip_korisnika == 2){
      return res.redirect('/home-kupac');
    } else{
      return res.redirect('/home-trgovac');
    }
  }

  res.render('index', { title: 'Express' });
});



router.get('/register',db.getKategorije, function(req, res, next) {
  res.render('register', { title: 'Registracija', kategorije: req.kategorije });
});

router.get('/registerTrgovac',db.getKategorije,function(req, res, next) {
  res.render('register-trgovac', { kategorije:req.kategorije });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Prijava' });
});

// POST METODE

router.post('/registerTrg',upload.single('slika'),db.registrujTrgovca, function(req, res, next) {
  res.redirect('/home-trgovac')
});


router.post('/register',db.registrujKorisnika, function(req, res, next) {
  res.redirect('/home-kupac');
});


router.post('/dodajArtikal', upload.single('slika'),db.dodajArtikal,function(req, res, next) {
  res.redirect('/home-trgovac');
});

router.post('/prikaziArtikal', function(req, res, next) {
  res.redirect('/artikal/' + req.body.sifraArtikla + "/" + req.body.sifraRadnje);
});

router.post('/prikaziArtikalZaPregled', function(req, res, next) {
  res.redirect('/artikal/' + req.body.sifraArtikla);
});

router.post('/urediTrgovca',upload.single('slika'),db.updateTrgovac,function(req, res, next) {
  res.redirect('/');
});

router.post('/urediArtikal', function(req, res, next) {
  res.redirect('/edit-artikal/' + req.body.sifraArtiklaZaEditovanje);
});

router.post('/obrisiArtikal/:kod',db.deleteArtikal, function(req, res, next) {
  res.redirect('/');
});

router.post('/posaljiUredeniArtikal',function(req, res, next) {
  res.redirect('/uredioSam/' + req.body.sifraArtikla);
});


router.post('/uredioSam/:idArt/:naziv/:cijena/:kategorija/:stanje/:kolicina/:detaljno',db.updateArtikal,function(req, res, next) {
  console.log("OVOMIDAJ");
  console.info("RAIDIDAJIDA");
  console.log(req.params.idArt);
  console.log(req.params.naziv);

});


router.post('/dodajOcjenuTrgovca/:rating/:idTrgovca',db.updateOcjenaTrgovca, function(req, res, next) {
  res.redirect('/');
});

router.post('/dodajOcjenu/:rating/:idArtikla',db.updateOcjena, function(req, res, next) {
  res.redirect('/');
});

router.post('/pretrazi',function(req, res, next) {
  if(req.body.vrstaPretrage == 1){
    res.redirect('/pretraga/artikli/' + req.body.search + "/" + req.body.vrstaPretrage);
  } else if(req.body.vrstaPretrage == 2) {
  res.redirect('/pretraga/trgovci/' + req.body.search + "/" + req.body.vrstaPretrage);
} else {
    res.redirect('/pretraga/kategorije/' + req.body.search + "/" + req.body.vrstaPretrage);
  }
});

router.post('/naruci',db.dodajNarudzbu,function(req, res, next) {
  res.redirect('/');
});

router.post('/dodajUKorpu/:kolicinaZaKorpe/:kodZaKorpe/:kodZaTrg',db.dodajUKorpu,function(req, res, next) {
  res.redirect('/');
});

router.post('/dodajNarudzbuDruga/:prva/:druga/:treca',db.dodajNarudzbuDrug,function(req, res, next) {
  res.sendStatus(200);
});

router.post('/obrisiUKorpi/:sifraKorpe',db.obrisiIzKorpe,function(req, res, next) {
  res.redirect('/');
});

router.post('/obrisiNarudzbu',db.obrisiNarudzbu,function(req, res, next) {
  res.redirect('/mojaKorpa');
});

router.post('/odobrenaNarudzba',db.odobriNarudzbu,function(req, res, next) {
  res.redirect('/narudzbe');
});




router.post('/prikaziTrgovca', function(req, res, next) {
  res.redirect('/trgovac/profile/' + req.body.sifraRadnje);
});


router.post('/blokirajKorisnika',db.blokiraj, function(req, res, next) {
  console.info(req.body.date)
  console.info(req.body.time)
  var datum= req.body.date + " " + req.body.time;
  console.info(datum);
  //2022-02-07 21:15:17.000000
  res.redirect('/home-admin');
});

router.post('/odblokirajKorisnika',db.odblokiraj, function(req, res, next) {
  res.redirect('/home-admin');
});

router.post('/blokirajTrgovca',db.blokirajTrg, function(req, res, next) {
  console.info(req.body.date)
  console.info(req.body.time)
  var datum= req.body.date + " " + req.body.time;
  console.info(datum);
  //2022-02-07 21:15:17.000000
  res.redirect('/home-admin');
});

router.post('/odblokirajTrgovca',db.odblokirajTrg, function(req, res, next) {
  res.redirect('/home-admin');
});


router.post('/login',passport.authenticate(['local-admin','local-kupci','local-trgovci'], {successReturnToOrRedirect: '/', failureRedirect: '/login'}), function(req, res, next) {
  console.info(req.user);
  res.sendStatus(200);
});

router.post('/logout', function(req, res, next) {
  req.logout();
  res.redirect('/');
});


module.exports = router;