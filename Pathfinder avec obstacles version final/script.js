const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const scale = 40;
const width = 10;
const height = 10;
var Depart = {x:3, y:3} 
var Cible = {x:7, y:7} 
var cellules = [];
var chemins = [];
var voisins = [];
var obstacles = [];
var nbrObstacle = 5;
var avecObstacles = true;

function render() {
    for (let i = 0; i < width; i++) {
        for (let j = 0; j < height; j++) {
                var cellule = {x: i+1, y: j+1, poids: Math.floor(Math.random()*10/1)};
                cellules.push(cellule);
                ctx.strokeRect(i * scale, j * scale, scale, scale)
                ctx.font = "20px Arial";
                ctx.fillStyle = "black";
                ctx.textAlign = "center";
                ctx.fillText(cellule.poids, (i+1) * scale - scale/2, (j+1) * scale - scale/3);
            }
    }

    var cellulesWithoutDandC = [...cellules];
    cellulesWithoutDandC.splice(cellulesWithoutDandC.findIndex(el => el.x === Depart.x && el.y === Depart.y),1);
    cellulesWithoutDandC.splice(cellulesWithoutDandC.findIndex(el => el.x === Cible.x && el.y === Cible.y),1);

    var indexObstacles = [];

    //permet d'etre sur d'avoir exactement le meme nombre d'obstacle que l'on souhaite et eviter les doublons
    for(var i = 0; i < nbrObstacle;){
      var index = Math.floor(Math.random() * 98);
      if(!indexObstacles.includes(index)){
        indexObstacles.push(index);
        i++;
      }
    }   


    if(avecObstacles){
      for(let i = 0; i < nbrObstacle; i++){
        var obstacle = cellulesWithoutDandC[indexObstacles[i]];
        obstacles.push(obstacle);
        ctx.clearRect((obstacle.x-1 * scale)+1 - scale, (obstacle.y-1 * scale)- scale+1, scale-2, scale-2)
        ctx.fillRect(obstacle.x * scale - scale, obstacle.y * scale - scale, scale, scale);
        ctx.fillStyle = "black";
      }
    }

    //design de la cellule de depart
    ctx.clearRect((Depart.x * scale)+1 - scale, (Depart.y * scale)- scale+1, scale-2, scale-2)
    ctx.font = "20px Arial";
    ctx.fillStyle = "red";
    ctx.textAlign = "center";
    ctx.fillText("D", Depart.x * scale - scale/2, Depart.y * scale - scale/3);

    //design de la cellule cible
    ctx.clearRect((Cible.x * scale)+1 - scale, (Cible.y * scale)- scale+1, scale-2, scale-2)
    ctx.font = "20px Arial";
    ctx.fillStyle = "green";
    ctx.textAlign = "center";
    ctx.fillText("C", Cible.x * scale - scale/2, Cible.y * scale - scale/3);
}

if (!Array.prototype.last){
  Array.prototype.last = function(){
      return this[this.length - 1];
  };
}

var cheminsWinners = [];
var generation;
var poids;
var plusPetitPoids = null;
var chemin = [];
var notFinish = true

function play(){


  celluleDepart = cellules.filter(cellule => {
    return cellule.x == Depart.x && cellule.y == Depart.y
  }).shift();

  celluleCible = cellules.filter(cellule => {
    return cellule.x == Cible.x && cellule.y == Cible.y
  }).shift();

  
  celluleDepart.poids = 0;
  celluleCible.poids = 0;

  chemin.push(celluleDepart);
  chemin.generation = 0;
  chemin.poids = celluleDepart.poids;
  chemins.push(chemin);

  generation = 1;


  while(notFinish){
    //recupere seulement les chemins de l'avant derniere generation
    cheminsGenMinusOne = chemins.filter(chemin => {
      return chemin.generation == generation-2
    });

    //recupere seulement les chemins de la derniere generation
    chemins = chemins.filter(chemin => {
        return chemin.generation == generation-1
    });
    cheminsEnd = chemins.filter(chemin => {
        return chemin.generation == "end"
    });
    //console.log(cheminsEnd)
    //check si si deux generations, si c'est le cas on stop le while
    if(JSON.stringify(cheminsGenMinusOne) === JSON.stringify(chemins) || chemins.length < 1){
      end();
      return notFinish;    
    }

    for(chemin of chemins){

      lastInsertCellule = chemin.last();
      
      //definition des voisins 
      voisins = [];
      voisins.push(cellules.filter(cellule => { return cellule.x == lastInsertCellule.x && cellule.y == lastInsertCellule.y + 1}).shift());
      voisins.push(cellules.filter(cellule => { return cellule.x == lastInsertCellule.x && cellule.y == lastInsertCellule.y - 1}).shift());
      voisins.push(cellules.filter(cellule => { return cellule.x == lastInsertCellule.x - 1 && cellule.y == lastInsertCellule.y}).shift());
      voisins.push(cellules.filter(cellule => { return cellule.x == lastInsertCellule.x + 1 && cellule.y == lastInsertCellule.y}).shift());

      for(voisin of voisins){
        //si le voisin existe (est dans le cadrillage) et n'est pas deja dans le chemin (pour eviter les retours en arriere)
        if(!chemin.includes(voisin) && !obstacles.includes(voisin) && voisin != undefined){
          //creer une copie du chemin
          newChemin = [...chemin];
          //ajoute a cette copie le nouveau voisin
          newChemin[newChemin.length] = voisin;
          //met a jour le poids du chemin
          newChemin.poids = chemin.poids + voisin.poids;
          //met a jour la generation du chemin
          newChemin.generation = generation;

          //si le chemin atteinds la cible
          if(voisin.x == Cible.x && voisin.y == Cible.y){
            //si c'est la premiere fois
            if(plusPetitPoids == null){
              firstFind();
            }
            //si c'est pas la premiere fois et que le poids du chemin ci est plus faible que le precedent
            if(newChemin.poids <= plusPetitPoids){
              findLighterChemin();
            }
          }
          //si on a deja trouver un chemin qui a atteinds la cible, on veut stopper les chemins ayant deja un poids plus eleve car ils ne seront jamais les chemins les plus "leger"
          if(plusPetitPoids != null && newChemin.poids > plusPetitPoids){
            filterChemin();
          }

          //si le chemin n'est pas "obsolete" = est encore de la partie car pas arrivé a la cible mais poids pas encore plus gros que le plus petit score
          if(newChemin.generation != "end"){
            //copie le tableau regroupant tous les chemins
            chemins = [...chemins];
            //ajoute a la fin tu tableau le nouveau chemin
            chemins[chemins.length] = newChemin;
          }
        }
      }
    }
    generation++;
  }
}

function end(){
  notFinish = false;
  //var cheminWin = cheminsWinners.last();
  cheminsWinners.forEach((cheminWin) => {
    cheminWin.forEach((el) => {
      ctx.globalAlpha = 0.2;
      ctx.fillRect(el.x * scale - scale, el.y * scale - scale, scale, scale);
      ctx.fillStyle = "green";
    })
    console.log("\n\nLe(s) chemin(s) avec le poids le plus faible est(sont) finalement celui(ceux) ci :\n")
    console.log(cheminsWinners);
  });
  return notFinish;
}

function filterChemin(){
  newChemin.generation = "end"; 
  //copie le tableau regroupant tous les chemins
  chemins = [...chemins];
  //ajoute a la fin tu tableau le nouveau chemin
  chemins[chemins.length] = newChemin;
}

function firstFind(){
  plusPetitPoids = newChemin.poids;
  newChemin.generation = "end"; 
  //copie le tableau regroupant tous les chemins
  chemins = [...chemins];
  //ajoute a la fin tu tableau le nouveau chemin
  chemins[chemins.length] = newChemin;
  cheminsWinners[chemins.length] = newChemin;
  console.log("Cible atteinte pour la premiere fois avec un poids de : "+newChemin.poids+"\nAttendons de voir si un chemin avec un poids plus faible est trouvable..\n");
}

function findLighterChemin(){
  if(newChemin.poids < plusPetitPoids){
    plusPetitPoids = newChemin.poids;
    cheminsWinners = [];
  }
  newChemin.generation = "end"; 
  //copie le tableau regroupant tous les chemins
  chemins = [...chemins];
  //ajoute a la fin tu tableau le nouveau chemin
  chemins[chemins.length] = newChemin;
  cheminsWinners[chemins.length] = newChemin;
  console.log("Cible atteinte avec un poids de : "+newChemin.poids+"\nAttendons de voir si un chemin avec un poids plus faible est trouvable..\n");
}

render();
document.getElementById("playButton").addEventListener("click", play);

