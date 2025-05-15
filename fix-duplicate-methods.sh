#!/bin/bash

# 备份原始文件
cp ./server/utils/sequelizeClient.js ./server/utils/sequelizeClient.js.bak

# 使用sed删除重复的userCreate方法
# 找到第二个方法并删除它
sed -i '' '/async userCreate({.*}/,/^  }$/{
  /async userCreate({.*}/,/^  }$/{
    /async userCreate({.*}/!{
      /^  }$/!{
        p
      }
    }
    /async userCreate({.*}/d
    /^  }$/d
  }
}' ./server/utils/sequelizeClient.js

# 添加注释替代删除的方法
sed -i '' 's/async userFindMany({.*}/\/\/ 已删除重复的userCreate方法\
  async userFindMany({/g' ./server/utils/sequelizeClient.js

echo "已修复重复的userCreate方法"
