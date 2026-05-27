interface DataItem {
  id: string | number;
  name: string;
  age: number;
  email: string;
  address: string;
  phone: string;
  score: number;
  [key: string]: any;
}

/**
 * 生成超大体积 JSON 对象数组（用于性能测试）
 * @param count 生成条数
 * @param startId 起始 id（用于生成 source / target 同源数据）
 * @returns 对象数组
 */
export function generateLargeJsonData(count: number, startId: number = 1): DataItem[] {
  const data: DataItem[] = [];

  for (let i = 0; i < count; i++) {
    const id = startId + i;

    data.push({
      id: id,
      name: `用户_${id}`,
      age: 18 + (i % 50),
      email: `user_${id}@test.com`,
      address: `地址_${id}_城市_${id % 100}_街道_${id % 500}`,
      phone: `138${Math.floor(Math.random() * 100000000)}`.padEnd(11, "0"),
      score: Math.random() * 100,
    });
  }

  return data;
}

/**
 * 生成 target 数据（部分字段随机修改，制造冲突/差异）
 */
export function generateTargetData(source: DataItem[], modifyRate: number = 0.3): DataItem[] {
  return source.map((item) => {
    const newItem = { ...item };

    if (Math.random() < modifyRate) {
      newItem.name = `【修改】${item.name}`;
    }
    if (Math.random() < modifyRate) {
      newItem.age = item.age + (Math.random() > 0.5 ? 1 : -1);
    }
    if (Math.random() < modifyRate) {
      newItem.score = Math.random() * 100;
    }

    return newItem;
  });
}
