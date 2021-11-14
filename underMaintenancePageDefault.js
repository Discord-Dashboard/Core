module.exports = ({title, contentTitle, texts=[], bodyBackgroundColors=['#ffa191', '#ffc247'], buildingsColor='#ff6347', craneDivBorderColor='#ff6347', craneArmColor='#f88f7c', craneWeightColor='#f88f7c', outerCraneColor='#ff6347', craneLineColor='#ff6347', craneCabinColor='#f88f7c', craneStandColors=['#ff6347', '#f29b8b']}) => {
    return `
    <!DOCTYPE html>
    <html lang="en">
        <head>
            <title>${title}</title>
            <style>
                @import url("https://fonts.googleapis.com/css?family=Ubuntu");
                #content-title {
                  text-align: center !important;
                }
                #outerCraneContainer {
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  bottom: 0;
                  overflow: hidden;
                  display: flex;
                  justify-content: center;
                  box-shadow: inset 0 -60px 0 -30px ${outerCraneColor};
                }
                .buildings {
                  height: 84.9673202614379px;
                  width: 100%;
                  left: 0;
                }
                .buildings div {
                  height: inherit;
                  width: 42.48366013071895px;
                  background: #ff6347;
                  position: absolute;
                  bottom: 10%;
                }
                .buildings div:after {
                  content: '';
                  width: 80%;
                  height: 60%;
                  left: 10%;
                  bottom: 30%;
                  background: url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAMAAAAGCAYAAAAG5SQMAAAAFElEQVQImWP4////fwYYIJKDEwAAfPsP8eFXG40AAAAASUVORK5CYII=") repeat;
                  position: absolute;
                }
                .buildings div:nth-of-type(1) {
                  width: 42.48366013071895px;
                  height: 21.241830065359476px;
                  right: 37%;
                  bottom: 18%;
                }
                .buildings div:nth-of-type(1):after {
                  bottom: 11%;
                }
                .buildings div:nth-of-type(2) {
                  width: 48.552754435107374px;
                  height: 28.322440087145967px;
                  right: 30%;
                  bottom: 35%;
                  transform: rotate(180deg);
                }
                .buildings div:nth-of-type(2):after {
                  width: 60%;
                  left: 11%;
                }
                .buildings div:nth-of-type(3) {
                  width: 24.276377217553687px;
                  height: 37.76325344952796px;
                  left: 40%;
                  bottom: 35%;
                }
                .buildings div:nth-of-type(3):after {
                  bottom: 0;
                  width: 20%;
                  height: 85%;
                  left: 70%;
                }
                .buildings div:nth-of-type(4) {
                  width: 84.9673202614379px;
                  height: 21.241830065359476px;
                  left: 24%;
                  bottom: 20%;
                }
                .buildings div:nth-of-type(4):after {
                  background: none;
                }
                .buildings div:nth-of-type(5) {
                  width: 61.794414735591204px;
                  height: 67.97385620915033px;
                  left: 47%;
                  bottom: 10%;
                }
                .buildings div:nth-of-type(5):after {
                  bottom: 0;
                  width: 40%;
                  height: 85%;
                  left: 20%;
                }
                .crane,
                .buildings {
                  position: absolute;
                  bottom: 0;
                }
                .crane div {
                  border-radius: 2px;
                  position: absolute;
                }
                .crane .line {
                  border: none;
                  background: ${craneLineColor};
                  outline: 1px solid transparent;
                  z-index: 0;
                }
                .crane .lineOne {
                  width: 60%;
                  left: 11%;
                  top: 0;
                }
                .crane .lineTwo {
                  width: 19%;
                  right: 8%;
                  top: 0;
                }
                .crane .line.lineThree {
                  height: 30%;
                  top: 22%;
                  left: 9%;
                }
                .crane .line.lineThree:after {
                  content: '';
                  position: absolute;
                  height: 0.2em;
                  width: 9000%;
                  background: ${craneLineColor};
                  display: block;
                  bottom: 0;
                  left: -4500%;
                  border: solid 1px #ff6347;
                }
                .craneTwo .line.lineThree:after {
                  height: 0.1em;
                }
                .craneThree .line.lineThree:after {
                  height: 0.05em;
                }
                .stand {
                  height: 100%;
                  width: 5%;
                  right: 25%;
                  z-index: 1;
                  background: linear-gradient(to top, ${craneStandColors[0]},  ${craneStandColors[1]});
                }
                .craneTwo .stand {
                  background: linear-gradient(to top, ${craneStandColors[0]},  ${craneStandColors[1]});
                }
                .craneThree .stand {
                  background: linear-gradient(to top, ${craneStandColors[0]},  ${craneStandColors[1]});
                }
                .weight {
                  height: 20%;
                  width: 8%;
                  right: 4%;
                  top: 12%;
                  z-index: 2;
                  background: ${craneWeightColor};
                }
                .craneTwo .weight {
                  background: ${craneWeightColor};
                }
                .craneThree .weight {
                  background: ${craneWeightColor};
                }
                .cabin {
                  height: 9%;
                  width: 12%;
                  right: 24%;
                  top: 20%;
                  z-index: 2;
                  background: ${craneCabinColor};
                }
                .cabin:after {
                  content: '';
                  position: absolute;
                  height: 10%;
                  width: 100%;
                  background: ${craneCabinColor};
                  display: block;
                  top: 60%;
                  left: 0;
                }
                .craneTwo .cabin {
                  background: ${craneCabinColor};
                }
                .craneThree .cabin {
                  background: ${craneCabinColor};
                }
                .arm {
                  height: 7%;
                  width: 100%;
                  top: 15%;
                  z-index: 3;
                  background: ${craneArmColor};
                }
                .craneTwo .arm {
                  background: ${craneArmColor};
                }
                .craneThree .arm {
                  background: ${craneArmColor};
                }
                .crane div.arm {
                  border-top-left-radius: 10px;
                }
                .brick {
                  height: 6%;
                  width: 9%;
                  bottom: 0;
                  left: 40%;
                  background: #ff7359;
                }
                .brickTwo {
                  left: 48%;
                }
                .brickThree {
                  bottom: 5.5%;
                  left: 44%;
                }
                .craneOne {
                  width: 260px;
                  height: 169.9346405228758px;
                  left: 20%;
                }
                .craneOne div {
                  border: solid 1px ${craneDivBorderColor};
                }
                .craneOne .line {
                  height: 1px;
                }
                .craneOne .lineThree {
                  width: 1px;
                }
                .craneTwo {
                  width: 200px;
                  height: 130.718954248366px;
                  transform: scaleX(-1);
                  left: 40%;
                  z-index: -1;
                }
                .craneTwo div {
                  border: solid 1px ${craneDivBorderColor};
                }
                .craneTwo .line {
                  height: 0.769230769230769px;
                }
                .craneTwo .lineThree {
                  width: 0.714285714285714px;
                  animation-delay: 3s;
                }
                .craneTwo .cabin,
                .craneTwo .arm,
                .craneTwo .picker,
                .craneTwo .weight {
                  animation-delay: 3s;
                }
                .craneThree {
                  width: 130px;
                  height: 84.9673202614379px;
                  left: 60%;
                  z-index: -1;
                }
                .craneThree div {
                  border: solid 1px ${craneDivBorderColor};
                }
                .craneThree .line {
                  height: 0.5px;
                }
                .craneThree .lineThree {
                  width: 0.5px;
                  animation-delay: 1.5s;
                }
                .craneThree .brickThree {
                  bottom: 5%;
                }
                .craneThree .brickOne,
                .craneThree .brickTwo {
                  bottom: 0;
                }
                .craneThree .cabin,
                .craneThree .arm,
                .craneThree .picker,
                .craneThree .weight {
                  animation-delay: 1.5s;
                }
                .crane {
                  perspective: 600px;
                }
                .lineOne {
                  transform-origin: right 0;
                  animation: moveLineOne 12s infinite alternate;
                }
                .lineTwo {
                  transform-origin: top left;
                  animation: moveLineTwo 12s infinite alternate;
                }
                .lineThree {
                  transform-origin: right center;
                  animation: moveLineThree 12s ease-in-out infinite alternate;
                }
                .cabin,
                .arm,
                .picker {
                  transform-origin: 80% center;
                  animation: moveCrane 12s infinite alternate;
                }
                .weight {
                  transform-origin: 0 center;
                  animation: moveWeight 12s infinite alternate;
                }
                html {
                  -ms-text-size-adjust: 100%;
                  -webkit-text-size-adjust: 100%;
                  -webkit-tap-highlight-color: transparent;
                }
                html,
                body {
                  height: 100%;
                }
                * {
                  box-sizing: border-box;
                }
                body {
                  background: linear-gradient(to top, ${bodyBackgroundColors[0]}, ${bodyBackgroundColors[1]});
                  -webkit-font-smoothing: antialiased;
                  -moz-osx-font-smoothing: grayscale;
                  text-shadow: 1px 1px 1px rgba(0,0,0,0.004);
                }
                #content {
                  height: 100%;
                  width: 100%;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  font-family: Ubuntu;
                  color: #fff;
                }

</style>
<style>
                #content h1,
                #content p {
                  margin: -8rem 0 0 1rem;
                }
                #content p {
                  margin-top: 0.5rem;
                }
                #license {
                  position: absolute;
                  bottom: 0;
                  right: 5px;
                }
                @-moz-keyframes moveCrane {
                  0%, 20% {
                    transform: rotateY(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg);
                  }
                }
                @-webkit-keyframes moveCrane {
                  0%, 20% {
                    transform: rotateY(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg);
                  }
                }
                @-o-keyframes moveCrane {
                  0%, 20% {
                    transform: rotateY(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg);
                  }
                }
                @keyframes moveCrane {
                  0%, 20% {
                    transform: rotateY(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg);
                  }
                }
                @-moz-keyframes moveWeight {
                  0%, 20% {
                    transform: rotateY(0) translateX(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) translateX(-50%);
                  }
                }
                @-webkit-keyframes moveWeight {
                  0%, 20% {
                    transform: rotateY(0) translateX(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) translateX(-50%);
                  }
                }
                @-o-keyframes moveWeight {
                  0%, 20% {
                    transform: rotateY(0) translateX(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) translateX(-50%);
                  }
                }
                @keyframes moveWeight {
                  0%, 20% {
                    transform: rotateY(0) translateX(0);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) translateX(-50%);
                  }
                }
                @-moz-keyframes moveLineOne {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(-10deg);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) rotateZ(-10deg);
                  }
                }
                @-webkit-keyframes moveLineOne {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(-10deg);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) rotateZ(-10deg);
                  }
                }
                @-o-keyframes moveLineOne {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(-10deg);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) rotateZ(-10deg);
                  }
                }
                @keyframes moveLineOne {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(-10deg);
                  }
                  70%, 100% {
                    transform: rotateY(45deg) rotateZ(-10deg);
                  }
                }
                @-moz-keyframes moveLineTwo {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(29deg);
                  }
                  70%, 100% {
                    transform: rotateY(15deg) rotateZ(29deg);
                  }
                }
                @-webkit-keyframes moveLineTwo {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(29deg);
                  }
                  70%, 100% {
                    transform: rotateY(15deg) rotateZ(29deg);
                  }
                }
                @-o-keyframes moveLineTwo {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(29deg);
                  }
                  70%, 100% {
                    transform: rotateY(15deg) rotateZ(29deg);
                  }
                }
                @keyframes moveLineTwo {
                  0%, 20% {
                    transform: rotateY(0) rotateZ(29deg);
                  }
                  70%, 100% {
                    transform: rotateY(15deg) rotateZ(29deg);
                  }
                }
                @-moz-keyframes moveLineThree {
                  0% {
                    transform: translate(0, 0);
                  }
                  20% {
                    transform: translate(2500%, -18%);
                  }
                  60% {
                    transform: translate(11000%, -25%);
                  }
                  70% {
                    transform: translate(9100%, -25%);
                    height: 30%;
                  }
                  90%, 100% {
                    transform: translate(9100%, -15%);
                    height: 80%;
                  }
                }
                @-webkit-keyframes moveLineThree {
                  0% {
                    transform: translate(0, 0);
                  }
                  20% {
                    transform: translate(2500%, -18%);
                  }
                  60% {
                    transform: translate(11000%, -25%);
                  }
                  70% {
                    transform: translate(9100%, -25%);
                    height: 30%;
                  }
                  90%, 100% {
                    transform: translate(9100%, -15%);
                    height: 80%;
                  }
                }
                @-o-keyframes moveLineThree {
                  0% {
                    transform: translate(0, 0);
                  }
                  20% {
                    transform: translate(2500%, -18%);
                  }
                  60% {
                    transform: translate(11000%, -25%);
                  }
                  70% {
                    transform: translate(9100%, -25%);
                    height: 30%;
                  }
                  90%, 100% {
                    transform: translate(9100%, -15%);
                    height: 80%;
                  }
                }
                @keyframes moveLineThree {
                  0% {
                    transform: translate(0, 0);
                  }
                  20% {
                    transform: translate(2500%, -18%);
                  }
                  60% {
                    transform: translate(11000%, -25%);
                  }
                  70% {
                    transform: translate(9100%, -25%);
                    height: 30%;
                  }
                  90%, 100% {
                    transform: translate(9100%, -15%);
                    height: 80%;
                  }
                }
                
                  body {
                    background-color: lightblue;
                  }
                  
                .text {
                     font-size: 30px;
                     text-align: center;
                }
                #content-title {
                    font-size: 40px;
                    text-align: center;
                }

                @media only screen and (min-device-width: 380px) {
                    .text {
                        font-size: 28px;
                        text-align: center;
                    }
                    #content-title {
                        font-size: 58px;
                        text-align: center;
                    }
                }
                
                @media only screen and (max-device-width: 430px) {
                    .text {
                        font-size: 50px;
                        text-align: center;
                    }
                    
                    #content-title {
                        font-size: 80px;
                        text-align: center;
                    }
                }
                
                @media only screen and (min-device-width: 750px) {
                    .text {
                        font-size: 20px;
                        text-align: center;
                    }
                    #content-title {
                        font-size: 40px;
                        text-align: center;
                    }
                }
</style>
        </head>
        <body style="margin: 0px !important;">
            <div id="content">
                <h1 id="content-title">${contentTitle}</h1>
                ${texts.map(text=>'<p class="text">'+text+'</p>').join('')}
            </div>
            <div id="outerCraneContainer">
                <div class="buildings">
                    <div></div>
                    <div class="1"></div>
                    <div class="2"></div>
                    <div class="3"></div>
                    <div class="4"></div>
                </div>
                <div class="crane craneThree">
                    <div class="line lineOne"></div>
                    <div class="line lineTwo"></div>
                    <div class="line lineThree"></div>
                    <div class="stand"></div>
                    <div class="weight"></div>
                    <div class="cabin"></div>
                    <div class="arm"></div>
                </div>
                <div class="crane craneTwo">
                    <div class="line lineOne"></div>
                    <div class="line lineTwo"></div>
                    <div class="line lineThree"></div>
                    <div class="stand"></div>
                    <div class="weight"></div>
                    <div class="cabin"></div>
                    <div class="arm"></div>
                </div>
                <div class="crane craneOne">
                    <div class="line lineOne"></div>
                    <div class="line lineTwo"></div>
                    <div class="line lineThree"></div>
                    <div class="stand"></div>
                    <div class="weight"></div>
                    <div class="cabin"></div>
                    <div class="arm"></div>
                </div>
            </div>
        </body>
    </html>
    `
}