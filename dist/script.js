/*
  This is a recreation of the "Going to Quasar" generative art piece by Hyper Glu.
  The original artwork can be found on their article here: 
  https://www.behance.net/gallery/45428489/Going-to-Quasar
  
  This was inspired by two other recreations of the work, ScieCode's P5.js remake and
  Dan Zen's follow-up ZIM port:
  https://codepen.io/sciecode/pen/QzMPgr
  https://codepen.io/danzen/pen/qBBEmjQ
  
  I was intrigued by Dan's claim that the ZIM port was 42% smaller than the P5.js
  implementation, so I was inspired to make my own port to see how much code it would
  take. Of course, with anything that compares the size of code it's always a question
  of metric. Are we comparing lines of code? Number of characters? API calls? It's hard
  to say objectively that one library offers more expressiveness than another and often
  it comes down to a matter of personal preference.
  
  To keep things fair, I tried to write it "source unseen" in the sense that I tried 
  not to pull techniques or code from the other implementations. That being said, 
  the ZIM port *is* a fair size smaller than ScieCode's original implenetation.
  For those interested, I've included the metrics for all 3 pieces of code 
  (ScieCode's, Dan Zan's, and my own) in the table below. I obtained these metrics 
  by taking each of the source codes and removing all tabs, comments, and empty lines.
  Metrics were pulled from Sublime-text 3's file stats.
  
  Implementor  | Library   | # lines   | # characters | % lines | % characters
  ----------------------------------------------------------------------------
  ScieCode     | P5.js     | 228       | 4761         | 100%    | 100%
  Dan Zen      | ZIM       | 92        | 2343         | 40.3%   | 49%
  Tsuhre       | P5.js     | 126       | 2974         | 55.2%   | 62%
  
  In the end I couldn't quite help myself from adding some extra bells and whistles 
  (such as the star field, zooming, variable planets, and regeneration) so it's not
  exactly an apples to apples comparison. Also, even though I wanted to keep the code
  clean and not codegolf it, there's definitely some funky code going on with 
  multiple turnaries, object destructuring, and the window scope trick for declaring
  and assigning a global variable in the same line.
  
  Ultimately, even though I didn't get the code smaller than Dan Zen's, I'm pleased
  with how the project turned out. In the end, I think it's best to just use whatever
  library you find the most comforatble for your work. Kudos abound for all 3 authors
  and especially for Hyper Glu for coming up with such an interesting and compelling
  visual.
  
  If you've read this far, here are a few more implementation notes:
  ---------------------------------------------------------------------------------
  I didn't end up using the original palette interpolation trick from Hyper Glu's
  original article. Instead, I generate the pallete using a random hue range
  and then directly interpolate the hue, saturation, and balance.
  
  I often find that dialing in the parameters on projects like this in an exercise
  in controlled randomness. Hence, there are a lot of magic numbers in the code to
  try to constrain the ranges of the random generators.
  
  A few other quirks are that I didn't scale the # of stars with the size of the
  canvas, so it likely looks different at different sizes. I also couldn't quite
  figure out a nice way to do the soft gradient on the planets. My technique results
  in the dark edge of the planet having almost no anti-aliasing due to the overlap of
  so many ellipses. This results in the profile of the planet being somewhat egg-like,
  but ultimately I decided it was an acceptable artifact ¯\_(ツ)_/¯.
  
  Anyway, thanks for reading! I had a lot of fun. Definitely go check out those other
  links, remember to stay creative, and just use the tools that feel best for you!
  
  - Ben
*/

let numArcs = 2000;
let zoomScale = 3;

function setup (){
  createCanvas();
  colorMode(HSB, 1, 1, 1);
  windowResized();
}

let spaceObject = ({col, hue, len, angle, radius, speed, target, isPlanet=false}) => 
                  ({col, hue, len, angle, radius, speed, target, isPlanet});

let rInt = (b, a=0) => floor(random(min(a, b), max(a, b)));

let init = () => {
  window.arcs       = [];
  window.planets    = [];
  window.stars      = [];
  
  window.numCircles = rInt(70, 120);
  window.radius     = min(width, height)*.45;
  window.arcSize    = radius/numCircles;
  window.center     = {x:0, y:0, radius, len:radius/2};
  
  window.baseHue  = random();
  window.hueRange = random(.2, .7)*(random() < .5 ? -1 : 1);
  window.colorMap = (amt, hueShift=0) => [(baseHue+amt*hueRange+hueShift)%1, amt, 1-amt];
  
  let variance = random(.05, .4);
  
  for (let i = 0; i < numArcs; i++){
    let radius = rInt(numCircles);
    let amt    = radius/numCircles + random(-variance, variance);
    amt = constrain(amt, 0, 1);
    
    arcs.push(spaceObject({
      col    : colorMap(amt),
      len    : random() < .2 ? 1/(TAU*radius) : random(PI/2),
      angle  : random(TAU),
      radius : radius*arcSize,
      speed  : random(0, .3) * (random() < .5 ? 1 : -1) * .02,
    }));
  }
  
  arcs = arcs.sort((a, b) => b.len-a.len);
  
  let numPlanets = rInt(2, 7);
  for (let i = 0; i < numPlanets; i++){
    let targetCenter = (planets.length > 0) && (random() < .5);
    let target = targetCenter ? planets[rInt(0, planets.length)] : center;
    let len    = random(.5, .7)*target.len;
    
    planets.push(spaceObject({
      hue      : random(-.15, .15), len,
      angle    : random(TAU),
      radius   : targetCenter ?  random(target.len/4) + (len+target.len)/2 : random(radius/numPlanets) + radius*((i/numPlanets)*.7 + .3),
      speed    : random(.2, .5) * .005,
      target, isPlanet : true,
    }))
  }
  
  for (let i = 0; i < 1000; i++) stars.push({
    x:random(width),
    y:random(height),
    size:random(2, 5),
    hue:random(-.2, .2)+baseHue,
    sat:random(.7),
    idx:random(1e7),
    speed:random(.1, .01)
  });
}

function draw(){
  background(0);
  
  if (mouseDown){
    translate(width/2, height/2);
    scale(zoomScale);
    translate(-mouseX, -mouseY);
  }
  
  pushPop(() => {
    translate(width/2, height/2);

    noStroke();
    for (let i = numCircles; i >= 0; i--){
      fill(colorMap((i/numCircles)*.9));
      ellipse(0, 0, i*arcSize*2);
    }

    pushPop(() => {
      translate(-width/2, -height/2);
      blendMode(ADD);
      for (let s of stars){
        let lum = noise(s.idx, s.idx+frameCount*s.speed);
        stroke(s.hue, s.sat, lum*.7);
        line(s.x-s.size/2, s.y, s.x+s.size/2, s.y);
        line(s.x, s.y-s.size/2, s.x, s.y+s.size/2);
      }
    });

    noFill();
    strokeWeight(arcSize);
  
    for (let o of arcs){
      o.angle += o.speed;
      stroke(...o.col, .5);
      arc(0, 0, o.radius*2, o.radius*2, o.angle, o.angle+o.len);
    }

    for (let o of planets){
      o.angle += o.speed;
      o.x = cos(o.angle)*o.radius + o.target.x;
      o.y = sin(o.angle)*o.radius + o.target.y;
      
      pushPop(() => {
        translate(o.x, o.y);
        let a = atan2(o.y, o.x);
        rotate(a);
        noStroke();
        let percent = (1-(Math.hypot(o.x, o.y)/radius)*.4);

        for (let i = o.len; i >= 0; i -= mouseDown ? 2/zoomScale : 2){
          let amt = i/o.len;
          let amt2 = (1-amt**5)*(percent) + (1-percent);
          fill(colorMap(amt2, o.hue));
          ellipse(-o.len*amt/2 +o.len/2-1, 0, o.len*amt, sin(amt*PI/2)*o.len);
        }
      });
    }
  });
}

let mouseDown = false;
function mousePressed(evt){
  if (evt.button == 2) init();
  else mouseDown = true;
  return false;
}

function mouseReleased(){
  mouseDown = false;
}

document.addEventListener('contextmenu', event => {
    event.preventDefault();
});

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
  init();
}

let pushPop = f => {push(); f(); pop();}