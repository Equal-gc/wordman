/*
 * Copyright (c) 2014, B3log Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview 数据库工具.
 *
 * @author <a href="http://88250.b3log.org">Liang Ding</a>
 * @version 1.2.3.2, Jul 15, 2014
 * @since 1.0.0
 */

"use strict";

// 数据库工具
var dbs = {
    /**
     * 打开数据库.
     * 
     * @returns {Database}
     */
    openDatabase: function () {
        if (window.sqlitePlugin) {
            return window.sqlitePlugin.openDatabase({name: "wordman.db"});
        }

        return window.openDatabase("wordman.db", "1.0", "Wordman DB", 1000000);
    },
    /**
     * 初始化数据库.
     * 
     * @param {Function} cb 回调，当且仅当确实初始化过数据库后才会执行该回调
     * @returns {undefined}
     */
    initDB: function (cb) {
        // XXX: 打包时
//        this.dropTables(function () {
            var db = dbs.openDatabase();

            db.transaction(function (tx) {
                tx.executeSql("select 1 from option", [], function (tx, result) {
                    $('#setup').remove();

                    console.debug('已经初始化过词库了');

                    clazz.countWords(function (count) {
                        console.info('所有词库单词计数 [' + count + ']');
                    });

                    window.location = "#lexicon-list";

                    return;
                }, function (tx, err) {
                    // option 表不存在，说明是第一次使用，进行数据库初始化

                    $("#setup").show();

                    $.get('resources/sql/install/1.0.0.sql', function (data) { // 获取建表语句
                        db.transaction(function (tx) {
                            console.info('第一次使用，初始化数据库');

                            // 每一句建表 SQL 使用 ---- 分割
                            var createTableSqls = data.split('----');

                            var count = 0;

                            for (var i in createTableSqls) {
                                tx.executeSql(createTableSqls[i], [], function (tx, result) {
                                    count++;
                                    if (parseInt(i) === count) {
                                        console.info('建表完毕');
                                        cb();
                                    }
                                }, function (tx, err) {
                                    console.error(err);

                                    cb(err);
                                });
                            }
                        });
//                    });
                });
            });
        });
    },
    /**
     * 生成 32 字符长度的唯一 id 字符串.
     * 
     * @returns {String}
     */
    genId: function () {
        return uuid().replace(new RegExp('-', 'gm'), '');
    },
    /**
     * 删除所有表，仅用于开发阶段.
     * 
     * @param {Function} cb 回调
     * @returns {undefined}
     */
    dropTables: function (cb) {
        var db = dbs.openDatabase();

        db.transaction(function (tx) {
            tx.executeSql('drop table if exists `class`');
            tx.executeSql('drop table if exists `option`');
            tx.executeSql('drop table if exists `learn_plan`');
            tx.executeSql('drop table if exists `review_plan`');
            tx.executeSql('drop table if exists `new_word`');

            tx.executeSql('drop table if exists `word_11`');
            tx.executeSql('drop table if exists `word_12`');
            tx.executeSql('drop table if exists `word_13`');
            tx.executeSql('drop table if exists `word_14`');
            tx.executeSql('drop table if exists `word_15`');
            tx.executeSql('drop table if exists `word_16`');
            tx.executeSql('drop table if exists `word_140`');
            tx.executeSql('drop table if exists `word_141`');
        }, function (err) {
        }, function () {
            console.info('删除所有表完毕');

            cb();
        });
    },
    /**
     * 用于标识客户端.
     * 
     * @returns {undefined}
     */
    wordman: function () {
        var uuid = dbs.genId();
        var time = new Date().getTime();

        var value = {
            uuid: uuid,
            time: time
        };

        var db = dbs.openDatabase();
        db.transaction(function (tx) {
            tx.executeSql('insert into option values (?, ?, ?, ?)', [dbs.genId(), 'conf', 'client', JSON.stringify(value)], function (tx, result) {
                console.info('沃德曼 [' + JSON.stringify(value) + ']');
            }, function (tx, err) {
                console.error('生成沃德曼异常', err);

                throw err;
            });
        });
    }

};

function uuid() {
    var s = [];
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
        s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";  // bits 12-15 of the time_hi_and_version field to 0010
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);  // bits 6-7 of the clock_seq_hi_and_reserved to 01
    s[8] = s[13] = s[18] = s[23] = "-";

    return s.join("");
}
