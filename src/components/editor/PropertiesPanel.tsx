'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SlideElement, Slide } from '@/types';

interface Props {
  element: SlideElement | null;
  slide: Slide | null;
  onUpdateElement: (id: string, updates: Partial<SlideElement>) => void;
  onUpdateSlide: (id: string, updates: Partial<Slide>) => void;
}

export default function PropertiesPanel({ element, slide, onUpdateElement, onUpdateSlide }: Props) {
  const [imgUrl, setImgUrl] = useState('');

  if (!element && !slide) {
    return (
      <div className="w-64 bg-white border-l p-4 text-sm text-zinc-400" data-testid="properties-panel">
        Select an element or slide to edit properties
      </div>
    );
  }

  const elStyle = element ? (typeof element.style === 'string' ? JSON.parse(element.style) : element.style) : {};
  const elContent = element ? (typeof element.content === 'string' ? JSON.parse(element.content) : element.content) : {};

  const updateStyle = (key: string, value: unknown) => {
    if (!element) return;
    onUpdateElement(element.id, { style: { ...elStyle, [key]: value } });
  };

  const updateContent = (key: string, value: unknown) => {
    if (!element) return;
    onUpdateElement(element.id, { content: { ...elContent, [key]: value } });
  };

  return (
    <div className="w-64 bg-white border-l flex flex-col" data-testid="properties-panel">
      <Tabs defaultValue={element ? 'element' : 'slide'} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-3">
          {element && <TabsTrigger value="element" data-testid="tab-element">Element</TabsTrigger>}
          <TabsTrigger value="slide" data-testid="tab-slide">Slide</TabsTrigger>
        </TabsList>

        {element && (
          <TabsContent value="element" className="flex-1 overflow-auto px-3 pb-3 space-y-4">
            <div>
              <Label className="text-xs uppercase text-zinc-500">Type</Label>
              <p className="text-sm font-medium capitalize" data-testid="prop-type">{element.type}</p>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs uppercase text-zinc-500">Position & Size</Label>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-[10px]">X</Label><Input type="number" value={Math.round(element.x)} onChange={e => onUpdateElement(element.id, { x: Number(e.target.value) })} data-testid="prop-x" /></div>
                <div><Label className="text-[10px]">Y</Label><Input type="number" value={Math.round(element.y)} onChange={e => onUpdateElement(element.id, { y: Number(e.target.value) })} data-testid="prop-y" /></div>
                <div><Label className="text-[10px]">W</Label><Input type="number" value={Math.round(element.width)} onChange={e => onUpdateElement(element.id, { width: Number(e.target.value) })} data-testid="prop-w" /></div>
                <div><Label className="text-[10px]">H</Label><Input type="number" value={Math.round(element.height)} onChange={e => onUpdateElement(element.id, { height: Number(e.target.value) })} data-testid="prop-h" /></div>
              </div>
              <div>
                <Label className="text-[10px]">Rotation</Label>
                <Slider value={[element.rotation]} min={-180} max={180} step={1} onValueChange={(v) => onUpdateElement(element.id, { rotation: Array.isArray(v) ? v[0] : v })} />
              </div>
            </div>

            <Separator />

            {(element.type === 'text' || element.type === 'heading') && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-zinc-500">Typography</Label>
                <div><Label className="text-[10px]">Font Size</Label><Input type="number" value={elStyle.fontSize || 16} onChange={e => updateStyle('fontSize', Number(e.target.value))} data-testid="prop-fontsize" /></div>
                <div><Label className="text-[10px]">Font Family</Label>
                  <select className="w-full text-sm border rounded px-2 py-1" value={elStyle.fontFamily || 'Arial'} onChange={e => updateStyle('fontFamily', e.target.value)} data-testid="prop-fontfamily">
                    <option>Arial</option>
                    <option>Georgia</option>
                    <option>Times New Roman</option>
                    <option>Helvetica</option>
                    <option>Verdana</option>
                    <option>Courier New</option>
                  </select>
                </div>
                <div><Label className="text-[10px]">Color</Label><Input type="color" value={elStyle.color || '#000000'} onChange={e => updateStyle('color', e.target.value)} data-testid="prop-color" /></div>
                <div><Label className="text-[10px]">Align</Label>
                  <div className="flex gap-1">
                    {['left', 'center', 'right'].map(a => (
                      <Button key={a} size="sm" variant={elStyle.textAlign === a ? 'secondary' : 'outline'} className="flex-1 text-xs" onClick={() => updateStyle('textAlign', a)} data-testid={`prop-align-${a}`}>{a[0].toUpperCase()}</Button>
                    ))}
                  </div>
                </div>
                <div><Label className="text-[10px]">Weight</Label>
                  <div className="flex gap-1">
                    {['normal', 'bold'].map(w => (
                      <Button key={w} size="sm" variant={elStyle.fontWeight === w ? 'secondary' : 'outline'} className="flex-1 text-xs" onClick={() => updateStyle('fontWeight', w)} data-testid={`prop-weight-${w}`}>{w}</Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {element.type === 'image' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-zinc-500">Image</Label>
                <Input placeholder="Image URL..." value={imgUrl} onChange={e => setImgUrl(e.target.value)} data-testid="prop-img-url" />
                <Button size="sm" className="w-full" onClick={() => { updateContent('src', imgUrl); setImgUrl(''); }} data-testid="prop-img-apply">Set Image</Button>
                {elContent.src && <img src={elContent.src} className="w-full h-20 object-cover rounded" alt="preview" />}
              </div>
            )}

            {element.type === 'shape' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-zinc-500">Shape</Label>
                <div><Label className="text-[10px]">Fill</Label><Input type="color" value={elStyle.backgroundColor || '#3B82F6'} onChange={e => updateStyle('backgroundColor', e.target.value)} data-testid="prop-fill" /></div>
                <div><Label className="text-[10px]">Border</Label><Input type="color" value={elStyle.borderColor || '#000000'} onChange={e => updateStyle('borderColor', e.target.value)} data-testid="prop-border-color" /></div>
                <div><Label className="text-[10px]">Border Width</Label><Input type="number" value={elStyle.borderWidth || 0} onChange={e => updateStyle('borderWidth', Number(e.target.value))} data-testid="prop-border-width" /></div>
                <div><Label className="text-[10px]">Border Radius</Label><Input type="number" value={elStyle.borderRadius || 0} onChange={e => updateStyle('borderRadius', Number(e.target.value))} data-testid="prop-radius" /></div>
                <div><Label className="text-[10px]">Opacity</Label><Slider value={[elStyle.opacity ?? 1]} min={0} max={1} step={0.05} onValueChange={(v) => updateStyle('opacity', Array.isArray(v) ? v[0] : v)} /></div>
              </div>
            )}

            {element.type === 'line' && (
              <div className="space-y-2">
                <Label className="text-xs uppercase text-zinc-500">Line</Label>
                <div><Label className="text-[10px]">Color</Label><Input type="color" value={elStyle.borderColor || '#000000'} onChange={e => updateStyle('borderColor', e.target.value)} data-testid="prop-line-color" /></div>
                <div><Label className="text-[10px]">Width</Label><Input type="number" value={elStyle.borderWidth || 2} onChange={e => updateStyle('borderWidth', Number(e.target.value))} data-testid="prop-line-width" /></div>
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="slide" className="flex-1 overflow-auto px-3 pb-3 space-y-4">
          {slide && (
            <>
              <div>
                <Label className="text-xs uppercase text-zinc-500">Background</Label>
                <div className="flex gap-2 mt-1">
                  <Input type="color" value={slide.background_color || '#ffffff'} onChange={e => onUpdateSlide(slide.id, { background_color: e.target.value })} data-testid="prop-bg-color" />
                  <span className="text-xs text-zinc-500 self-center">{slide.background_color}</span>
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase text-zinc-500">Layout</Label>
                <select className="w-full text-sm border rounded px-2 py-1 mt-1" value={slide.layout} onChange={e => onUpdateSlide(slide.id, { layout: e.target.value })} data-testid="prop-layout">
                  <option value="blank">Blank</option>
                  <option value="title">Title</option>
                  <option value="title-content">Title + Content</option>
                  <option value="two-column">Two Column</option>
                  <option value="image-text">Image + Text</option>
                </select>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
