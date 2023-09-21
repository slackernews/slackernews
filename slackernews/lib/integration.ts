import { DataTypes } from "sequelize";
import { getSequelize } from "./db";
import { SlackerNewsConfig, getParam } from "./param";
import { SlackChannel, SlackUser } from "./slack";
import * as cheerio from 'cheerio';
import { DefaultIntegration } from "./integrations/default";
import { GitHubIntegration } from "./integrations/github";
import { GoogleDriveIntegration } from "./integrations/googledrive";
import { AsanaIntegration } from "./integrations/asana";
import { DiscourseIntegration } from "./integrations/discourse";
import { OutlineIntegration } from "./integrations/outline";
import { SlackIntegration } from "./integrations/slack";
import { ShortcutIntegration } from "./integrations/shortcut";
import { FigmaIntegration } from "./integrations/figma";
import { CodaIntegration } from "./integrations/coda";
import { LinearIntegration } from "./integrations/linear";
import { NotionIntegration } from "./integrations/notion";

export interface IntegrationWithConfig {
  id: string;
  title: string;
  icon: string;
  version: string;
  is_enabled: boolean;
  schema: any;  // the schema for the user supplied config
  config?: any;  // the user supplied config
}

const defaultIntegration = {
  id: "default",
  title: "Default",
  icon: "",
  version: "v0.0.1",
  is_enabled: true,
  schema: '{}',
  config: '{}',
};

export async function DefaultIntegrations() {
  const i = await Integration();
  await i.sync();
  i.bulkCreate([
    {
      id: "github",
      title: "GitHub",
      icon: "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyRpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpFNTE3OEEyQTk5QTAxMUUyOUExNUJDMTA0NkE4OTA0RCIgeG1wTU06RG9jdW1lbnRJRD0ieG1wLmRpZDpFNTE3OEEyQjk5QTAxMUUyOUExNUJDMTA0NkE4OTA0RCI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkU1MTc4QTI4OTlBMDExRTI5QTE1QkMxMDQ2QTg5MDREIiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOkU1MTc4QTI5OTlBMDExRTI5QTE1QkMxMDQ2QTg5MDREIi8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+m4QGuQAAAyRJREFUeNrEl21ojWEYx895TDPbMNlBK46IUiNmPvHBSUjaqc0H8pF5+aDUKPEBqU2NhRQpX5Rv5jWlDIWlMCv7MMSWsWwmb3tpXub4XXWdPHvc9/Gc41nu+nedc7/8r/99PffLdYdDPsvkwsgkTBwsA/PADJCnzX2gHTwBt8Hl7p537/3whn04XoDZDcpBlk+9P8AFcAghzRkJwPF4zGGw0Y9QS0mAM2AnQj77FqCzrtcwB1Hk81SYojHK4DyGuQ6mhIIrBWB9Xm7ug/6B/nZrBHBegrkFxoVGpnwBMSLR9EcEcC4qb8pP14BWcBcUgewMnF3T34VqhWMFkThLJAalwnENOAKiHpJq1FZgI2AT6HZtuxZwR9GidSHtI30jOrbawxlVX78/AbNfhHlomEUJJI89O2MqeE79T8/nk8nMBm/dK576hZgmA3cp/R4l9/UeSxiHLVIlNm4nFfT0bxyuIj7LHRTKai+zdJobwMKzcZSJb0ePV5PKN+BqAAKE47UlMnERELMM3EdYP/yrd+XYb2mOiYBiQ8OQnoRBlXrl9JZix7D1pHTazu4MoyBcnYamqAjIMTR8G4FT8LuhLsexXYYjICBiqhQBvYb6fLZIJCjPypVvaOoVAW2WcasCnL2Nq82xHJNSqlCeFcDshaPK0twkAhosjZL31QYw+1rlMpWGMArl23SBsZZO58F2tlJXmjOXS+s4WGvpMiBJT/I2PInZ6lIs9/hBsNS1hS6BG0DSqmYEDRlCXQrmy50P1oDRKTSegmNbUsA0zDMwRhPJXeCE3vWLPQMvan6X8AgIa1vcR4AkGZkDR4ejJ1UHpsaVI0g2LInpOsNFUud1rhxSV+fzC9Woz2EZkWQuja7/B+jUrgtIMpy9YCW4n4K41YfzRneW5E1KJTe4B2Zq1Q5EHEtj4U3AfEzR5SVY4l7QYQPJdN2as7RKBF0BPZqqH4VgMAMBL8Byxr7y8zCZiDlnOcEKIPmUpgB5Z2ww5RdOiiRiNajUmWda5IG6WbhsyY2fx6m8gLcoJDJFkH219M3We1+cnda93pfycZpIJEL/s/wSYADmOAwAQgdpBAAAAABJRU5ErkJggg==",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["personalAccessToken"],"properties":{"personalAccessToken":{"type":"string","title":"Personal Access Token","default":""}}}',
    },
    {
      id: "discourse",
      title: "Discourse",
      icon: "iVBORw0KGgoAAAANSUhEUgAAAEIAAABCCAMAAADUivDaAAABhlBMVEX///8Aru8AqVDx8fHxXCIxLS4jHyD/+a5MSUqRj48ArceEgYL80ovIx8fwWCJoZWZaV1j95Z3lGyTZGyS1HCOEHSKsq6s7HyGenZ26ubntRCP1g0XrPCMAq5ZUHiHqNyMgs1wPb5QSZ4gUXnsAqm6P1oUAqnghKC0CpeIJirsHk8hwzHn3oV92c3Tj4+PvUCLuTCOf24v2l1cAq4xAvWgQrlboKyTW1dXf76IArKkYTGE/OzyoHCOcHSN4HSJsHiIArKAfMTpgHiH5tHGA0X8AruUvHyAArdELga74q2gcOkcAqVr+76UNeKHnJyQaQ1TsQCMAq4LyZisEnNX7yILzcDTNHCTwVCIwuGIArdv0eTz83JQUXV36vnrpLyPqMyMArLNQwm0WVW4AqmTP6pz0i1cpkWRHHiEwIyDiX0akRSH1jU4SZmorbVYCpLrKUSJgx3PaHyTtSCOgMSI+qVbxaDStw3Ygs2a2JCMLf2ntSSznIyTmHyS/5Zfv9KiVSiSLkGAArL0hUEW0AAAAAXRSTlMAQObYZgAAA05JREFUeF6l12OT7UoYBeB0x9u2ObZtG8e2ee37z086s2s3JklnKut7nuoXkWAXMatHNKWTSFgPCjfLUEZT2MjhlHsgG1GsI/uHXAGpecUhg3wkqCnOkXVnQPQr/GjTDsK0prhKxr4LsuIyg3aC4j4R0UoYVG4SzcLIXANKS8lEIrGQXHpteQ5uFcsLMZz4Yonfj2kaWLrVAY6mUAzl1hpnLuI8VcEV8Gd5ROrkdu5RLJFmDWo/wqSQNIGpEYlO4esy21JCyJLColnAFXA59jCgGokG1t9LUjnJGDpRBiuUTWAsoJJ5mB/+zhjde05nhZwJRFU2gXvv3lhORZSJUSBhGJUQUK2y+5k9BrtU6bghfDOE/IFqnV/+tToG0YmEIZygIlTb/PSRJGSR2aoSGqazoI7CB6SRQoQfE2ipb0vSPdUpldYcuxu4jrQhFCTpLOpINOGnNmGIqA5qHKFQaF11zAxs7dCVpKg6HqMyOLkDt48x4adaETcHesEj+mGxl2oGfu1sGXUYO6Xy0oQNsIoNQZDxSM2JDnCJvyEEVXJBFUyY87jvhvD1YSLIEmeqKwK07YgRKe+KWAF4JhmW2HVJ1LuEThBbLokmImo0gffixA3Rj3pRowvB21lwQ9yhiSBJLMemXBAzEMJNmqCaIQ24acVzAJ4xq4WfvcP8oVYgLAJiqAJFlGJl7mqNQgi3ASBfzwqZhb9CnAX/p2LWgW9VP0Ok44UB7kThE0BsVpYhlPjjS95mokMQN7vIniKWG3MSXkxCtBTgsCuEBYZYi4WiPKFIHSLFEslHeZ7QAIB44MgCSyRyFw7jNIVNAM7bxD3GEvGf7ff6KewIYI95LVPdPFq3A75AlFMkPCPfACyx9sdBd3obozPd65sTJrA/C2hBFq8RyZedvvVXoJHJiacbGxMTk/Aq46iInjn6m48lfot2rm+MP7nrG9+HOI1ZBIC+VebrlSXeGtf/2lrxbfb1VmuHAPhmiy0jpyv/3wUoPXWFiDx0nUj/9+r3D7Xj4w64Wu0BZM7rbYVMVsCEfeaqvVfM+U59z+KLkUO4/yXxLggeBE9ERvBIyEHBIxEWBW/EPFoHL4Ssi4InQksZgAdC89v9aLspPxLWs6Jglx9jWK1zy5IVHwAAAABJRU5ErkJggg==",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type": "object","required": ["apiKey", "apiUsername", "domain"],"properties": {"apiKey": {"type": "string","title": "API Key","default": ""},"apiUsername": {"type": "string","title": "API Username","default": ""},"domain": {"type": "string","title": "Domain","default": ""}}}',
    },
    {
      id: "notion",
      title: "Notion",
      icon: "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",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["integrationToken"],"properties":{"integrationToken":{"type":"string","title":"Integration Token","default":""}}}',
    },
    {
      id: "outline",
      title: "Outline",
      icon: "iVBORw0KGgoAAAANSUhEUgAAACQAAAAtCAYAAADGD8lQAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAJJSURBVHgB7ZlfbtNAEIdnxk4fUW6Ab1DnBA0HKPEjgiByAEqTE5CeAAsOQJCAV4w4ALkB6Q1yhMBjG88w4zgVTkq2auM0lfaTHDtex/vz/rG0XxC2RNLrN2EOcS55TECHghLradtmKJhhA8+yUTp13QfhFiTP+lHegDbmHCPJY0GMQSDa+COB6Z8GtcajdLbpsnBT4X+eOmLgJooekdWD9uEGIXo0574eDe1r5+XpRwFpi8g04GCQfU0na4EsQH6Z9wjhyJ6a5xwV90LUOm9Sq5PTZSBmPtf79hAwYuJfxy9OBj++fEivuuxp983y4ibUCDG1rDWOu68TBPpWKQN6QmWYt7pL6w5T1lrUEYThZLVIu+8VaTdFUDbjfWNjivJLHsK+oAM/1EF0dE1R8e7QJvwtAU2A86YOwHewA0JLtXqSWHQavh/9e67TPenoFG9DzdC1ZzkYwz1BsGf4QC58IBc+kAsfyIUP5MIHcuEDufCBXPhALnwgFz6QiwcSKHTYsBqxpfR0VcepIfupS+dMl87nur4vFNwultGLQALfYWG2KmiARHeJ2bNdQmq0RrAvqBgl02skMoBdc3GxZuvUN46LQZ2pbLRQ2jkzqBsu66CD9UDqsq9mmYXCkFpSBJNMw01g22iXLPWvqeaV0kKsV7RwadrTcqt4am3OGFEl+V1mGxYTaHFosl1nOKqnRgjOss/peHHJLUie92N9g0Xqmttq8g81pD3tZoNrA1ZNfuYw+Vub0xXrj+YtMZLyvw4dN5/ogIauMMZfofvggdY6sIwAAAAASUVORK5CYII=",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type": "object","required": ["outlineToken", "domain"],"properties": {"outlineToken": {"type": "string","title": "Outline Token","default": ""},"domain": {"type": "string","title": "Domain","default": ""}}}',
    },
    {
      id: "shortcut",
      title: "Shortcut",
      icon: "iVBORw0KGgoAAAANSUhEUgAAAGAAAAA2CAYAAAA4T5zSAAAACXBIWXMAAA7EAAAOxAGVKw4bAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMi0xMC0wNlQyMzo0Nzo0OS0wNTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjItMTAtMDZUMjM6NDk6MTctMDU6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjItMTAtMDZUMjM6NDk6MTctMDU6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6YjI5NjJkNDAtMmJiYS0zYTQy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",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["shortcutToken"],"properties":{"shortcutToken":{"type":"string","title":"Shortcut Token","default":""}}}',
    },
    {
      id: "googledrive",
      title: "Google Drive",
      icon: "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",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["serviceAccountKey"],"properties":{"serviceAccountKey":{"type":"string","title":"Service Account Key","default":""}}}',
    },
    {
      id: "code",
      title: "Code",
      icon: "iVBORw0KGgoAAAANSUhEUgAAADIAAAAyEAYAAABOr1TyAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFEmlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDIgNzkuMTYwOTI0LCAyMDE3LzA3LzEzLTAxOjA2OjM5ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgKFdpbmRvd3MpIiB4bXA6Q3JlYXRlRGF0ZT0iMjAyMi0xMC0xMFQxNDo0MDoyNC0wNTowMCIgeG1wOk1vZGlmeURhdGU9IjIwMjItMTAtMTBUMTQ6NDM6MTctMDU6MDAiIHhtcDpNZXRhZGF0YURhdGU9IjIwMjItMTAtMTBUMTQ6NDM6MTctMDU6MDAiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0ic1JHQiBJRUM2MTk2Ni0yLjEiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Mzc4YzI0YWMtZDA5OS00NDQ2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",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["apiToken"],"properties":{"apiToken":{"type":"string","title":"API Token","default":""}}}',
    },
    {
      id: "asana",
      title: "Asana",
      icon: "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAMAAABHPGVmAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAACN1BMVEUAAADxZ2fva2vxaWnwaWnxamr/AADvamrwa2vvamrwamrvbGzwaGjwamrwaWnva2vtamrwamrwamrsaGjwaWnwamrwamrwaGjwamrwa2vwamrvamrxamrwamrwa2vwbW3wamrwamrwbGz/gIDwamrvaWnwaWnvaWn/Zmbwa2v/VVXxaWnxaWnwamrwaWnrYmLqamrwamrwamrvamrwamrvamrvamrxamrwamrwa2vwamrwamrxamrxa2vwa2vrbGzwamrwaWnwa2vyZmbwamrzbW3xa2vwamrtbW3xamrwamruZmbxaWnwamrwamrxbGzvamrxaWnwa2vvaWnwa2vwaWnwa2vya2vvaGjwamrwamrwaWnva2vvaGjvamrvamrvamrvamrxaGj/VVX/gIDxa2vwamrxa2vuZmbwamrvamrya2vyaWnva2vwamrwa2vwamrwaWnxY2PuamrwamrwamrvaWnwamrxaWnxamrxaWnwa2vxamrwamrmZmbwamr0b2/wamrodHTwaWnvamrvcHDxamrwamrzZ2fwaWnya2vva2vwa2vxa2vwamrvaWnwaWnxamrvaWnwamrxamrxa2vvaWnwa2vuamryamrzaGjwamrxamrwaWnwamrwaWnvaWnwamrwamrjcXHwamrxa2vxaWnwamrwamrybGzwamrwamrvaWnybGzxamrxa2vya2vxaWnwamrwamrwamrwamrwamrxamrwamrwamrxamrwamr///+1C+LWAAAAu3RSTlMAJU9tdyQBQZ7mnUBT0dBRHbq3G0Ts6kJU+fhSSPpFI/DvIQLHxGZhBeEGXFq7uA0MRnRxlZOjoaalmph/fFYa03l1FPQVjYkO5ecPSf79R4J+hoPtm5kTIIvkih8xb8UwczYDBDecbh7pkSYnkuOI/JYSTevxX/JLfY96jnYK3xfuC4WAEGzKKhFMYmRKjHKnsrOusKCiaTw6FvXDrGVoTtjoCddYa8vzKPb7UDtZXTk4rbm+yFfU4GdqrIiJzgAAAAFiS0dEvErS4u8AAAAHdElNRQfmCgsAOy5xHC9oAAADcUlEQVRo3u2Z+VeMURjHb9OYFGWmTaNGMSOmGEtJNRGtWmaiXaWkRJIaW4QKCZEtabPvypKIuP+ccSzvO/Pee5/pvHcOx3m/P3++53POzJ33Pu8zCClRokTJfx8fla9a7aua5zWBxm++P/4V/4AFGm84FgZilwQt4q7Q6rAkwSF8HaFhmJDwxTwdEXpMzJJIfo4oA6ZEv5SXIzoGU7NsOR+H0YQZWcHnKMdiZlbycKwysyXmOA6SeAxkNQfJGkhike9Ya4AkhnWyJVGQA+P1siUbYEmCbEkiLNkoW5IESzbJliTDkhTZklRYYpUtSYMlm2VLtsCSCNmSdFjC4RbeCjkC5TvQNkiSwUGSmcV2ZGVzkKActiSXhwNtz2M58gu4SFChje6wF/FxILSDLtnJy4E0VpojkZvDaSkmKmwlfEf7yFKpI0zFVeFMdpnbZW8or+DtcKZyl+gsV1XXeEHxI8bdtVZLXZ3FWrvH6CWFkr8a5zdcbqkz6crq9zbAdOO++iadyXke9s/hPBzIrRLOavPBFjZ9qDVcoA+3aT1SVFjdfnXtSel0OiTZ7krrHUdgx9Fj0ufH8XgafaJDSoefhBxp5LujlfhhG8mDsu0U29FJe6YnESzGFBqdw3Kcpl5O+IyUbqXTZ+kOv3Z6TfpqyJot7aE0R1c3o4ZL3UafnnMs2nyeIrmAmXEb3gPYdC/ZURDDrhlcbhCtnk3HXCRKajGQEjFdDNF9RMklqNYtgjVmiDaRHBV2qIZFT7HLINx+hSDpB2v4qkBfg+kBgiQDrlUL9HWYvkGQdMI10WvuTZgmPCNQGVy7JdC3YTqVILHCtUGBvgPTDoKkGq4NCfRdmG4jSIbhmug9oRemYwmSEbgm2gJHwPQoQRKXBbXsmQI9ZoPoceJuchCq3RPTJoi+T3IgFVR7IKYfQvQjoqThMbv15KmY7mpm088oc95zdu2FK53ApqlbHR2r9dJtYG0MYtHBNAfqyae3Xr12p1s66HQzY+gcmaC1Jvul9BvqcDPxFjFSOE5uGd6R6PeTZHq8EDEzRVykhFH2ywPEsajqAwIyNi1tfdTS6MpPUnrak91U0Yxrif1f3+cvrvSMp0v1Kcfs705ekx+w2jCGDv05lLOOUc8MP1MT9VWtHu6P9oz2UfWp1d8GKudiUKJEiZJ/PN8BkI9JJL+soXQAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjItMTAtMTFUMDA6NTk6NDUrMDA6MDA1VWgzAAAAJXRFWHRkYXRlOm1vZGlmeQAyMDIyLTEwLTExVDAwOjU5OjQ1KzAwOjAwRAjQjwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMi0xMC0xMVQwMDo1OTo0NiswMDowMCL1680AAAAASUVORK5CYII=",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["personalAccessToken"],"properties":{"personalAccessToken":{"type":"string","title":"Personal Access Token","default":""}}}',
    },
    {
      id: "linear",
      title: "Linear",
      icon: "iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAMAAABg3Am1AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAe1BMVEUAAABgcM9gac9eatNfatJfa9JeatNgaM9eatFfa9Nfa9FeadRfa9JdadFeatJeatJea9Fea9FcatNdatJeas9eatFdas9da9JcbNJeatJaZc9cbNNYaM9eatFda9Jdac9catFda9NeatFQcM9datJda9Jea9ReatL////nnG/HAAAAJ3RSTlMAEFBvn49/IIC/z1+fcO/foM9/n4B/YL9QTzBAIM+fcG+/3xCvj18LAmXGAAAAAWJLR0QovbC1sgAAAAd0SU1FB+YKDAMcHhKRK0EAAAD+SURBVEjH7dTLlsIgDAbgYCk4M0oH61yszM2qef83tMfFnEAJxK3Hf9FFT76S0BaAR65Ri0Zr3ZqFFVUvn/A/zy81o1aYRBfJ2uEs3Zp//Ctm06p8vfXIxOcFW8+JDQ+wh1vFbHK7LQuXNrXCinhLdnS6VRbpEu9VkSxRFx/RyEogaE+fXiB2BBgUiIYAjQKhCRicQFAgEhGQiBZuFIZU761A0G21nUAE2lBXF1/RBAaroonA9HnXRNQRwHdNpH91cGXhkgUAfrAofmGWv5LIHTPqwAs/ZgAEVvgA2agjI0bgsskI/rS/tjV7H32AcsLpQIUoYZguQ2/OoxDcfS5McHwHCabcrAAAACV0RVh0ZGF0ZTpjcmVhdGUAMjAyMi0xMC0xMlQwMzoyODoyOSswMDowMGZhrUEAAAAldEVYdGRhdGU6bW9kaWZ5ADIwMjItMTAtMTJUMDM6Mjg6MjkrMDA6MDAXPBX9AAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIyLTEwLTEyVDAzOjI4OjMwKzAwOjAwGRtxbwAAAABJRU5ErkJggg==",
      version: "v0.0.1",
      is_enabled: false,
      schema: '{"type":"object","required":["personalAPIKey"],"properties":{"personalAPIKey":{"type":"string","title":"Personal API Key","default":""}}}',
    },
  ]);
}

export async function Integration() {
  const model = (await getSequelize()).define('integration', {
    id: {
      type: DataTypes.STRING,
      allowNull: false,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    icon: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    is_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      default: false,
    },
    schema: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
  }, {
    tableName: 'integration',
    timestamps: false,
  });

  return model;
}

export async function getIntegration(id: string): Promise<IntegrationWithConfig> {
  const integration = await (await Integration()).findOne({
    where: {
      id,
    },
  });

  const config = await (await SlackerNewsConfig()).findOne({
    where: {
      key: `integration_${id}_config`,
    },
  });

  return {
    id: integration.id,
    title: integration.title,
    icon: integration.icon,
    version: integration.version,
    is_enabled: integration.is_enabled,
    schema: integration.schema,
    config: config ? config.val : "{}",
  };
}

export async function listIntegrations(): Promise<IntegrationWithConfig[]> {
  const integrations = await (await Integration()).findAll();

  const withConfig: IntegrationWithConfig[] = [];

  for (const integration of integrations) {
    const config = await (await SlackerNewsConfig()).findOne({
      where: {
        key: `integration_${integration.id}_config`,
      },
    });

    withConfig.push({
      id: integration.id,
      title: integration.title,
      icon: integration.icon,
      version: integration.version,
      is_enabled: integration.is_enabled,
      schema: integration.schema,
      config: config ? config.val : "{}",
    });
  }

  return withConfig;
}

export async function setIntegrationConfig(id: string, config: string): Promise<void> {
  await (await SlackerNewsConfig()).upsert({
    key: `integration_${id}_config`,
    val: config,
  });
}

export async function setIntegrationEnabled(id: string, is_enabled: boolean): Promise<void> {
  console.log(`setIntegrationEnabled ${id} ${is_enabled}`);
  await (await Integration()).update({
    is_enabled,
  }, {
    where: {
      id,
    },
  });
}

export async function getDocumentIcon(configuredIntegration: IntegrationWithConfig, url: string): Promise<string> {
  console.log(`getDocumentIcon ${configuredIntegration.id} ${url}`);

  const i = getIntegrationInstance(configuredIntegration);
  return await i.getDocumentIcon(url);
}

export async function getDocumentTitle(configuredIntegration: IntegrationWithConfig, url: string, user: SlackUser, channel: SlackChannel): Promise<string> {
  console.log(`getDocumentTitle ${configuredIntegration.id} ${url} ${user.id} ${channel.id}`);

  const i = getIntegrationInstance(configuredIntegration);
  console.log(i);
  return await i.getDocumentTitle(url, user, channel);
}

export async function getCleanedUrl(configuredIntegration: IntegrationWithConfig, url: string): Promise<string> {
  console.log(`getCleanedUrl ${configuredIntegration.id} ${url}`);

  const i = getIntegrationInstance(configuredIntegration);
  return await i.getCleanedUrl(url);
}

export async function getDomain(configuredIntegration: IntegrationWithConfig, url: string): Promise<string> {
  console.log(`getDomain ${configuredIntegration.id} ${url}`);

  const i = getIntegrationInstance(configuredIntegration);
  return await i.getDomain(url);
}

function getIntegrationInstance(configuredIntegration: IntegrationWithConfig): any {
  const config = configuredIntegration.config ? JSON.parse(configuredIntegration.config) : {};
  switch (configuredIntegration.id) {
    case "default":
      return new DefaultIntegration(config);
    case "github":
      return new GitHubIntegration(config);
    case "googledrive":
      return new GoogleDriveIntegration(config);
    case "asana":
      return new AsanaIntegration(config);
    case "discourse":
      return new DiscourseIntegration(config);
    case "slack":
      return new SlackIntegration(config);
    case "outline":
      return new OutlineIntegration(config);
    case "shortcut":
      return new ShortcutIntegration(config);
    case "figma":
      return new FigmaIntegration(config);
    case "coda":
      return new CodaIntegration(config);
    case "linear":
      return new LinearIntegration(config);
    case "notion":
      return new NotionIntegration(config);
  }
}

export async function getResponsibleIntegration(url: string): Promise<IntegrationWithConfig> {
  const allIntegrations = await listIntegrations();
  const enabledIntegrations = allIntegrations.filter((integration) => {
    return integration.is_enabled;
  });

  for (const integration of enabledIntegrations) {
    const i = getIntegrationInstance(integration);
    if (await i.isUrlManagedByIntegration(url)) {
      return integration;
    }
  }

  // return a default integration
  return defaultIntegration;
}
