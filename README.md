# data-mask-kit

数据脱敏，零依赖、全 TypeScript。手机号 / 身份证 / 银行卡 / 姓名 / 邮箱 / 通用字符串，核心原则「保留首尾、中间打码」。从 SaaS 平台的日志脱敏、列表展示、接口返回脱敏场景提炼。

## 安装

```bash
npm install data-mask-kit
```

## 快速开始

```ts
import { maskPhone, maskIdCard, maskBankCard, maskName, maskEmail, maskString, maskObject } from 'data-mask-kit'

maskPhone('13812345678')        // 138****5678
maskIdCard('110101199001011234') // 110101********1234
maskBankCard('6222021234567890') // 622202******7890
maskName('张三丰')               // 张**
maskName('欧阳娜娜')             // 欧阳**   （复姓自动识别）
maskEmail('zhangsan@example.com') // z******n@example.com
maskString('abcdefg', 2, 2)      // ab***fg

// 批量脱敏对象字段，返回新对象（不修改原对象）
maskObject(user, { phone: 'phone', idCard: 'idCard', name: 'name' })
```

## API

| 函数 | 说明 |
| --- | --- |
| `maskPhone(v)` | 手机号，保留前 3 后 4 |
| `maskIdCard(v)` | 身份证，保留前 6（地区码）后 4 |
| `maskBankCard(v)` | 银行卡，保留前 6（BIN）后 4（卡尾） |
| `maskName(v)` | 姓名，保留姓氏（复姓自动识别） |
| `maskEmail(v)` | 邮箱，保留首字符 + 域名 |
| `maskString(v, keepHead, keepTail)` | 通用，保留首尾打码中间 |
| `mask(v, type)` | 按类型调度 |
| `maskObject(obj, rules)` | 按字段规则批量脱敏 |

所有函数支持 `{ char }` 自定义遮罩字符（默认 `*`）。

## ⚠️ 三个必须知道的坑

### 1. 每种敏感信息的「保留位数」是行业约定，不能乱来

- 手机号保留前 3 后 4：`138****5678`，既看不出完整号码，又保留号段 + 尾号可识别。
- 身份证保留前 6（地区码）+ 后 4（末位校验位），中间 8 位生日全打码——生日是核心隐私。
- 银行卡保留前 6（BIN，识别发卡行）+ 后 4（卡尾），中间全打码。

脱敏不是「随便打几个星」，保留错了会泄露关键信息或失去业务可用性。

### 2. 姓名脱敏要处理复姓

「欧阳娜娜」如果只保留 1 个字符会变成「欧**」，把复姓拆开。本库内置 80+ 常见复姓表，`欧阳/司马/诸葛/上官/令狐` 等自动保留 2 字。

### 3. 邮箱脱敏别把域名也打码

`zhangsan@example.com` 应该打码用户名、**保留 `@` 和域名**（用户要靠域名识别是哪家服务）。正确：`z******n@example.com`，而不是 `z***@***.com`。

## 实现要点

- 脱敏核心是 `maskString(value, keepHead, keepTail)`：保留首尾、中间重复 `char`。
- 太短的字符串（不足以保留首尾）退化为「保留首字符 + 其余打码」，不抛错。
- 姓名用 `[...str]` 按码点拆分，正确处理生僻字/emoji（不把代理对拆坏）。

## License

MIT
