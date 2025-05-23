import { writeFileSync } from "node:fs"
import { join } from "node:path"
import { pinyin } from "@napi-rs/pinyin"
import { projectDir } from "../shared/dir"
import { sources } from "../shared/sources"

const pinyinMap = Object.fromEntries(Object.entries(sources)
  .filter(([, v]) => !v.redirect)
  .map(([k, v]) => {
    return [k, pinyin(v.title ? `${v.name}-${v.title}` : v.name).join("")]
  }))

writeFileSync(join(projectDir, "./shared/pinyin.json"), JSON.stringify(pinyinMap, undefined, 2))
