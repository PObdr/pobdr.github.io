import{r as e}from"./rolldown-runtime-QTnfLwEv.js";import{n as t,t as n}from"./jsx-runtime-BX1tsrJU.js";import{c as r,f as i,l as a,n as o,r as s}from"./satie-1aY5M1-K.js";import{t as c}from"./lodash-C3hWziae.js";/* empty css              */var l=c(),u=e(t(),1),d=n(),f=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 3.0 Partwise//EN"
                                "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise>
  <movement-title>Satie Sandbox</movement-title>
  <identification>
    <miscellaneous>
      <miscellaneous-field name="description">
        A song created at https://nettek.ca/satie
      </miscellaneous-field>
    </miscellaneous>
  </identification>
  <part-list>
    <score-part id="P1">
      <part-name>MusicXML Part</part-name>
    </score-part>
  </part-list>
  <!--=========================================================-->
  <part id="P1">
    <measure number="1">
      <attributes>
        <divisions>1</divisions>
        <key>
          <fifths>-3</fifths>
          <mode>minor</mode>
        </key>
        <time symbol="common">
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
        <clef>
          <sign>G</sign>
          <line>2</line>
        </clef>
      </attributes>
      <note>
        <rest measure="yes" />
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <rest measure="yes" />
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
    <measure number="3">
      <note>
        <rest measure="yes" />
        <duration>4</duration>
        <voice>1</voice>
        <type>whole</type>
      </note>
    </measure>
  </part>
</score-partwise>`,p=class extends u.Component{state={error:null,canonicalOperations:null,operations:null,oldOperations:[null],note:r.Eighth,type:`N`,lastPath:null,lastPitch:null};_setNote(e){this.setState({note:e})}_setType(e){this.setState({type:e})}_song;_undo(){this.setState({operations:this.state.oldOperations[this.state.oldOperations.length-1],canonicalOperations:this.state.oldOperations[this.state.oldOperations.length-1],oldOperations:this.state.oldOperations.slice(0,this.state.oldOperations.length-1)})}_newMeasure(){let e=this._song.getDocument(this.state.canonicalOperations).measures.length,t=this.state.oldOperations.concat([this.state.canonicalOperations]),n=this._song.createCanonicalPatch(this.state.canonicalOperations,{documentBuilder:t=>t.insertMeasure(e,e=>e.part(`P1`,e=>e.voice(1,e=>e.at(0).insertChord([e=>e.rest({}).staff(1).noteType(e=>e.duration(r.Whole))]))))});this.setState({operations:n,oldOperations:t,canonicalOperations:n})}_newCursor(){let e=[{p:[this._song.getDocument(this.state.canonicalOperations).measures[0].uuid,`parts`,`P1`,`voices`,`1`,1],li:{_class:`VisualCursor`}}],t=this.state.oldOperations.concat([this.state.operations]),n=this._song.createCanonicalPatch(this.state.canonicalOperations,{raw:e});this.setState({operations:n,oldOperations:t,canonicalOperations:n})}render(){return(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`h1`,{children:`Satie – Sandbox`}),(0,d.jsxs)(`div`,{className:void 0,children:[(0,d.jsx)(`p`,{children:`Use this page to test song editing.`}),(0,d.jsxs)(`ul`,{style:{display:`flex`,listStyleType:`none`},children:[(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r._32nd),children:`32`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r._16th),children:`16`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r.Eighth),children:`8`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r.Quarter),children:`4`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r.Half),children:`2`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setNote.bind(this,r.Whole),children:`1`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setType.bind(this,`N`),children:`N`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._setType.bind(this,`R`),children:`R`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._undo.bind(this),children:`Undo`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._newMeasure.bind(this),children:`+`})}),(0,d.jsx)(`li`,{style:{padding:10},children:(0,d.jsx)(`a`,{href:`#`,onClick:this._newCursor.bind(this),children:`+`})})]}),(0,d.jsx)(s,{baseSrc:f,onError:this._errorHandler,patches:this.state.operations,onMouseClick:this._mouseClickHandler,onMouseMove:this._mouseMoveHandler,pageClassName:void 0,singleLineMode:!0,ref:this._setSongRef})]})]})}_errorHandler=e=>{console.warn(e),(0,l.defer)(()=>{this.setState({error:e})})};_setSongRef=e=>{this._song=e,window._song=e};_mouseMoveHandler=e=>{(0,l.isEqual)(this.state.lastPath,e.path)&&(0,l.isEqual)(e.pitch,this.state.lastPitch)||this._handler(e,!0)||this.setState({operations:this.state.canonicalOperations})};_mouseClickHandler=e=>{this._handler(e,!1)};_handler(e,t){let{path:n,pitch:r}=e,s=this.state.oldOperations.concat([this.state.canonicalOperations]),c=this.state.canonicalOperations,u=this._song.getDocument(c),d=(0,l.find)(u.measures,e=>String(e.uuid)===n[0]);if(!d||n[1]!==`parts`||!d.parts[n[2]])return!1;let f=d.parts[n[2]];if(n[3]===`staves`){if(!f.staves[parseInt(n[4],10)])return!1}else if(n[3]===`voices`){let e=f.voices[parseInt(n[4],10)];if(!e)return!1;let l=parseInt(n[5],10),d=e[l];if(!d||!u.modelHasType(d,i.Chord))return!1;let p=d,m=parseInt(n[0],10),h;if(this.state.type===`N`&&p.length===1&&p[0].rest||this.state.type===`R`&&p.length===1&&!p[0].rest?h=o.createPatch(t,u,m,`P1`,e=>e.voice(1,e=>e.at(l).note(0,e=>this.state.type===`R`?e.pitch(null).dots([]).noteType(e=>e.duration(this.state.note)).color(t?`#cecece`:`#000000`):e.pitch(r).dots([]).noteType(e=>e.duration(this.state.note)).accidental(e=>e.accidental(a.Sharp)).color(t?`#cecece`:`#000000`)))):this.state.type===`N`&&p.length&&!p[0].rest&&p[0].noteType.duration!==this.state.note&&(h=o.createPatch(t,u,m,`P1`,e=>e.voice(1,e=>e.note(0,e=>e.noteType(e=>e.duration(this.state.note)).color(t?`#cecece`:`#000000`)),l))),h){if(t)this.setState({operations:this._song.createPreviewPatch(c,{raw:h}),lastPath:n,lastPitch:r});else{let e=this._song.createCanonicalPatch(c,{raw:h});this.setState({operations:e,canonicalOperations:e,lastPath:null,lastPitch:null,oldOperations:s})}return!0}}return!1}};function m(){return(0,d.jsxs)(`div`,{children:[(0,d.jsx)(`h1`,{children:`Satie – Sandbox`}),(0,d.jsx)(p,{})]})}var h=m;export{h as component};