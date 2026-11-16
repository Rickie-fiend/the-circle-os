import {personalImprintSamples} from "./imprint-personal-samples.js";
// Fictional inputs only; six cases cover two examples of each course family.
export const loopImprintSamples=personalImprintSamples.map(s=>structuredClone(s));
for(const[id,name,birthday]of[["noor","Noor","1992-05-20"],["tala","Tala","1998-03-14"],["sori","Sori","1985-09-27"]]){
 const sample=structuredClone(personalImprintSamples[loopImprintSamples.length%3]);sample.id=id;sample.label=name;sample.input.name=name;sample.input.birthday=birthday;loopImprintSamples.push(sample);
}
