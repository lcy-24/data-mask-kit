/**
 * data-mask-kit
 * 数据脱敏：手机号 / 身份证 / 银行卡 / 姓名 / 邮箱 / 通用字符串，零依赖、全 TypeScript。
 *
 * 从 SaaS 聚合平台的日志脱敏、列表展示、接口返回脱敏场景提炼。
 * 核心原则：**保留首尾、中间打码**，且每种敏感类型用各自的行规。
 */

export interface MaskOptions {
  /** 遮罩字符，默认 '*' */
  char?: string
}

/** 常见复姓（用于姓名脱敏保留姓氏时判断） */
const COMPOUND_SURNAMES = new Set([
  '欧阳', '太史', '端木', '上官', '司马', '东方', '独孤', '南宫', '万俟', '闻人',
  '夏侯', '诸葛', '尉迟', '公羊', '赫连', '澹台', '皇甫', '宗政', '濮阳', '公冶',
  '太叔', '申屠', '公孙', '慕容', '仲孙', '钟离', '长孙', '宇文', '司徒', '鲜于',
  '司空', '闾丘', '子车', '亓官', '司寇', '巫马', '公西', '颛孙', '壤驷', '公良',
  '漆雕', '乐正', '宰父', '谷梁', '拓跋', '夹谷', '轩辕', '令狐', '段干', '百里',
  '呼延', '东郭', '南门', '羊舌', '微生', '公户', '公玉', '公仪', '梁丘', '公仲',
  '公上', '公门', '公山', '公坚', '左丘', '公伯', '西门', '公祖', '第五', '公乘',
])

/**
 * 通用脱敏：保留前 keepHead 位、后 keepTail 位，中间全部打码。
 * 若字符串长度不足以保留首尾，则只保留首部打码剩余。
 */
export function maskString(value: string, keepHead: number, keepTail: number, options: MaskOptions = {}): string {
  const char = options.char ?? '*'
  const s = String(value ?? '')
  const len = s.length
  if (len === 0) return s
  if (len <= keepHead + keepTail) {
    // 太短时至少保留首字符，其余打码
    return s[0] + char.repeat(Math.max(0, len - 1))
  }
  const head = s.slice(0, keepHead)
  const tail = s.slice(len - keepTail)
  return head + char.repeat(len - keepHead - keepTail) + tail
}

/** 手机号脱敏：138****5678（保留前 3 后 4） */
export function maskPhone(phone: string, options: MaskOptions = {}): string {
  return maskString(String(phone ?? ''), 3, 4, options)
}

/** 身份证脱敏：110101********1234（保留前 6 地区码、后 4 校验位） */
export function maskIdCard(idCard: string, options: MaskOptions = {}): string {
  return maskString(String(idCard ?? ''), 6, 4, options)
}

/** 银行卡脱敏：622202******7890（保留前 6 BIN、后 4 卡尾） */
export function maskBankCard(card: string, options: MaskOptions = {}): string {
  return maskString(String(card ?? ''), 6, 4, options)
}

/** 姓名脱敏：保留姓氏，复姓自动识别（欧阳 → 欧**，张三丰 → 张**） */
export function maskName(name: string, options: MaskOptions = {}): string {
  const char = options.char ?? '*'
  const s = String(name ?? '').trim()
  if (!s) return s
  const surname = [...s].slice(0, 2).join('')
  const isCompound = COMPOUND_SURNAMES.has(surname)
  const keepHead = isCompound ? 2 : 1
  const rest = [...s].slice(keepHead).length
  return s.slice(0, keepHead) + char.repeat(Math.max(0, rest))
}

/**
 * 邮箱脱敏：保留首字符 + @ 后的域名（zhangsan@example.com → z***n@example.com）。
 * 用户名不足 3 位时只保留首字符。
 */
export function maskEmail(email: string, options: MaskOptions = {}): string {
  const char = options.char ?? '*'
  const s = String(email ?? '').trim()
  const at = s.indexOf('@')
  if (at <= 0) {
    // 不是合法邮箱，退化为通用脱敏
    return maskString(s, 1, 1, options)
  }
  const user = s.slice(0, at)
  const domain = s.slice(at)
  const maskedUser =
    user.length <= 2
      ? user[0] + char.repeat(user.length - 1)
      : user[0] + char.repeat(user.length - 2) + user[user.length - 1]
  return maskedUser + domain
}

/** 脱敏调度：根据类型选择对应规则 */
export type MaskType = 'phone' | 'idCard' | 'bankCard' | 'name' | 'email'

export function mask(value: string, type: MaskType, options: MaskOptions = {}): string {
  switch (type) {
    case 'phone':
      return maskPhone(value, options)
    case 'idCard':
      return maskIdCard(value, options)
    case 'bankCard':
      return maskBankCard(value, options)
    case 'name':
      return maskName(value, options)
    case 'email':
      return maskEmail(value, options)
    default:
      return maskString(value, 3, 4, options)
  }
}

/**
 * 批量脱敏对象：按字段规则对对象指定字段打码，返回新对象（不修改原对象）。
 *
 * @example
 * maskObject(user, { phone: 'phone', idCard: 'idCard', name: 'name' })
 */
export function maskObject<T extends Record<string, unknown>>(
  obj: T,
  rules: Partial<Record<keyof T, MaskType>>,
  options: MaskOptions = {},
): T {
  const result = { ...obj }
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const type = rules[key]
    if (type && result[key] != null) {
      result[key] = mask(String(result[key]), type, options) as T[keyof T]
    }
  }
  return result
}
