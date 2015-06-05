define([
    "jquery",
    "components/gsap"
], function($,gsap){
    return function($scope,element){
        console.log("slide controller perform",element);
        var slideState = 0;
        var keydown = function(e){
            
            if(e.keyCode == "39"){
                if(slideState === 0){
                    console.log("keydown",e);
                    e.stopImmediatePropagation();
                    e.preventDefault();
                    slideState++;
                    var mw = element.find(".m-word");
                    gsap.tween.set(mw,{
                        display: "inline-block"
                    });
                    gsap.tween.to(element.find(".tcont"),0.5,{
                        scale: 0.6
                    });
                    gsap.tween.from(mw,0.5,{
                        width: 0,
                        opacity: 0,
                        ease: Quad.easeOut
                    }).eventCallback("onComplete", function(){
                        gsap.tween.set(mw,{
                           width: "" 
                        });
                    });
                }
            }
        }
        document.body.addEventListener("keydown",keydown);
        $scope.$on("$destroy",function(){
            console.log('destroy scope');
            document.body.addEventListener("keydown",keydown);
        });
    };
})